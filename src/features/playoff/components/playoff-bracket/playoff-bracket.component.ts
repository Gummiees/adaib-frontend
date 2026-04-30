import {
  CdkDragDrop,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminGroupService } from '@features/admin/features/group/services/admin-group.service';
import { AdminMatchService } from '@features/admin/features/match/services/admin-match.service';
import { AdminRoundService } from '@features/admin/features/round/services/admin-round.service';
import { competitionEvents } from '@features/competition/store/competition-events';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { UserStore } from '@features/user/store/user-store';
import { Dispatcher } from '@ngrx/signals/events';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { Group } from '@shared/models/group';
import { DetailedMatch } from '@shared/models/match';
import { Phase } from '@shared/models/phase';
import { Team } from '@shared/models/team';
import { firstValueFrom } from 'rxjs';
import {
  PlayoffMatchView,
  PlayoffRoundView,
  PlayoffSeedSlot,
  ScoreDraft,
  ScoreSide,
} from '../../models/playoff-bracket';
import { PlayoffBracketAdminService } from '../../services/playoff-bracket-admin.service';
import {
  getMatchWinner,
  PLAYOFF_BRACKET_SIZE,
  getPlayoffLegCount,
  getPlayoffGroupName,
  getPlayoffRoundNames,
  getPlayoffSourceTeams,
  isPlayoffPhase,
  PLAYOFF_SOURCE_PHASE_NAME,
  sortPlayoffMatches,
} from '../../utils/playoff-utils';

@Component({
  selector: 'app-playoff-bracket',
  templateUrl: './playoff-bracket.component.html',
  styleUrls: ['./playoff-bracket.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    AdminGroupService,
    AdminRoundService,
    AdminMatchService,
    PlayoffBracketAdminService,
  ],
  imports: [
    CommonModule,
    DragDropModule,
    FullSpinnerComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatTooltipModule,
  ],
})
export class PlayoffBracketComponent {
  public competitionStore = inject(CompetitionStore);
  public userStore = inject(UserStore);
  private playoffAdminService = inject(PlayoffBracketAdminService);
  private adminMatchService = inject(AdminMatchService);
  private dispatcher = inject(Dispatcher);
  private snackBar = inject(MatSnackBar);

  private seedSlots = signal<PlayoffSeedSlot[]>([]);
  private scoreDrafts = signal<Record<number, ScoreDraft>>({});
  private dateDrafts = signal<Record<string, string>>({});
  private locationDrafts = signal<Record<string, string>>({});
  private isSaving = signal(false);
  private loadedSeedKey = signal<string | null>(null);
  public selectedLeagueGroupId = signal<number | null>(null);

  public playoffPhase = computed(
    () =>
      this.competitionStore
        .competition()
        ?.phases.find((phase) => isPlayoffPhase(phase)) ?? null,
  );

  public leagueGroups = computed<Group[]>(() => {
    return (
      this.competitionStore
        .competition()
        ?.phases.filter((phase) => phase.name === PLAYOFF_SOURCE_PHASE_NAME)
        .flatMap((phase) => phase.groups)
        .filter((group) => group.teamIds.length > 0) ?? []
    );
  });

  public selectedLeagueGroup = computed<Group | null>(() => {
    const selectedGroupId = this.selectedLeagueGroupId();
    const groups = this.leagueGroups();

    if (selectedGroupId) {
      return groups.find((group) => group.id === selectedGroupId) ?? null;
    }

    const currentGroup = this.competitionStore.group();
    if (currentGroup !== 'all' && groups.some((group) => group.id === currentGroup.id)) {
      return currentGroup;
    }

    return groups[0] ?? null;
  });

  public playoffGroupName = computed<string | null>(() => {
    const group = this.selectedLeagueGroup();
    return group ? getPlayoffGroupName(group.name) : null;
  });

  public playoffGroup = computed<Group | null>(() => {
    const phase = this.playoffPhase();
    const playoffGroupName = this.playoffGroupName();

    if (!phase || !playoffGroupName) {
      return null;
    }

    return (
      phase.groups.find((group) => group.name === playoffGroupName) ??
      null
    );
  });

  public sourceTeams = computed<Team[]>(() => {
    const group = this.selectedLeagueGroup();

    if (!group) {
      return [];
    }

    return getPlayoffSourceTeams(group);
  });

  public isAdmin = computed(() => !!this.userStore.user());

  public isBusy = computed(
    () => this.competitionStore.isLoading() || this.isSaving(),
  );

  public visibleSeedSlots = computed(() => this.seedSlots());

  public availableTeams = computed<Team[]>(() => {
    const selectedTeamIds = new Set(
      this.seedSlots()
        .map((slot) => slot.team?.id)
        .filter((teamId): teamId is number => !!teamId),
    );

    return this.sourceTeams().filter((team) => !selectedTeamIds.has(team.id));
  });

  public seedDropListIds = computed<string[]>(() => [
    'available-playoff-teams',
    ...this.seedSlots().map((_, index) => this.getSeedDropListId(index)),
  ]);

  public bracketRounds = computed<PlayoffRoundView[]>(() => {
    const phase = this.playoffPhase();
    const group = this.playoffGroup();
    const slots = this.seedSlots();

    if (!phase || slots.length === 0) {
      return [];
    }

    const roundNames = getPlayoffRoundNames(this.teamCount());
    const roundCount = roundNames.length;
    let incomingTeams = slots.map((slot) => slot.team);
    const playoffTeamIds = new Set(
      this.sourceTeams().map((team) => team.id),
    );

    return roundNames.map<PlayoffRoundView>((name, roundIndex) => {
      const round =
        phase.rounds.find((phaseRound) => phaseRound.name === name) ??
        phase.rounds[roundIndex] ??
        null;
      const savedMatches = round && group
        ? sortPlayoffMatches(
            group.matches.filter((match) => match.round.id === round.id),
          )
        : [];
      const matchCount = Math.max(1, incomingTeams.length / 2);
      let savedMatchOffset = 0;
      const matches = Array.from({ length: matchCount }, (_, matchIndex) => {
        const homeTeam = incomingTeams[matchIndex * 2] ?? null;
        const awayTeam = incomingTeams[matchIndex * 2 + 1] ?? null;
        const tieLegCount = this.getExpectedLegCount({
          roundIndex,
          roundCount,
          homeTeam,
          awayTeam,
        });
        const tieMatches = savedMatches.slice(
          savedMatchOffset,
          savedMatchOffset + tieLegCount,
        ).filter((match) => this.isPlayoffTeamMatch(match, playoffTeamIds));
        savedMatchOffset += tieLegCount;

        return this.buildMatchView({
          savedMatches: tieMatches,
          matchIndex,
          roundIndex,
          roundCount,
          homeTeam,
          awayTeam,
        });
      });

      incomingTeams = matches.map((match) => match.winner);

      return {
        index: roundIndex,
        name,
        round,
        matches,
      };
    });
  });

  public teamCount = computed(
    () => this.sourceTeams().length,
  );

  public canSaveSeeds = computed(
    () => this.isAdmin() && !!this.playoffPhase() && this.teamCount() > 1,
  );

  constructor() {
    effect(() => {
      this.syncSeedSlotsFromCompetition();
      this.syncScoreDraftsFromMatches();
      this.syncDateDraftsFromMatches();
      this.syncLocationDraftsFromMatches();
    });
  }

  public onLeagueGroupChange(groupId: number): void {
    this.selectedLeagueGroupId.set(groupId);
    this.loadedSeedKey.set(null);
  }

  public onBracketSlotDrop(event: CdkDragDrop<unknown>, seedIndex: number): void {
    if (!this.isAdmin()) {
      return;
    }

    const team = event.item.data as Team | null;
    if (!team) {
      return;
    }

    const slots = [...this.seedSlots()];
    const previousIndex = slots.findIndex((slot) => slot.team?.id === team.id);
    const previousTeamInSlot = slots[seedIndex]?.team ?? null;

    if (previousIndex === seedIndex || !slots[seedIndex]) {
      return;
    }

    if (previousIndex >= 0) {
      slots[previousIndex] = {
        ...slots[previousIndex],
        team: previousTeamInSlot,
      };
    }

    slots[seedIndex] = {
      ...slots[seedIndex],
      team,
    };

    this.seedSlots.set(
      slots.map((slot, index) => ({ ...slot, seed: index + 1 })),
    );
  }

  public onAvailableTeamsDrop(event: CdkDragDrop<unknown>): void {
    if (!this.isAdmin()) {
      return;
    }

    const team = event.item.data as Team | null;
    if (!team) {
      return;
    }

    this.seedSlots.update((slots) =>
      slots.map((slot) =>
        slot.team?.id === team.id ? { ...slot, team: null } : slot,
      ),
    );
  }

  public getSeedSlotIndex(matchIndex: number, side: ScoreSide): number {
    return matchIndex * 2 + (side === 'away' ? 1 : 0);
  }

  public getSeedDropListId(seedIndex: number): string {
    return `playoff-seed-slot-${seedIndex}`;
  }

  public async onSaveSeeds(): Promise<void> {
    const competition = this.competitionStore.competition();
    const phase = this.playoffPhase();
    const playoffGroupName = this.playoffGroupName();
    const openingRound = this.bracketRounds()[0];

    if (!competition || !phase || !playoffGroupName || !openingRound) {
      return;
    }

    const seedTeamIds = this.seedSlots().map((slot) => slot.team?.id ?? null);
    const openingLegs = openingRound.matches.flatMap((match) => match.legs);

    const teamIds = seedTeamIds.filter((teamId): teamId is number => !!teamId);
    const uniqueTeamIds = new Set(teamIds);

    if (
      teamIds.length !== this.teamCount() ||
      uniqueTeamIds.size !== teamIds.length
    ) {
      this.snackBar.open(
        'Todos los equipos deben estar una sola vez en el bracket',
        'Cerrar',
      );
      return;
    }

    this.isSaving.set(true);
    try {
      await this.playoffAdminService.saveSeedsAndOpeningRound({
        competitionId: competition.id,
        phase,
        playoffGroupName,
        seedTeamIds,
        scheduledDates: openingLegs.map((leg) =>
          this.getApiDateDraft(leg.dateDraftKey),
        ),
        locations: openingLegs.map((leg) =>
          this.getLocationDraftValue(leg.locationDraftKey, leg.homeTeam?.arena),
        ),
        existingMatches: openingLegs
          .map((leg) => leg.match)
          .filter((match): match is DetailedMatch => !!match),
      });
      this.refreshCompetition();
      this.snackBar.open('Play-Off guardado correctamente', 'Cerrar', {
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al guardar el Play-Off', 'Cerrar');
    } finally {
      this.isSaving.set(false);
    }
  }

  public onScoreChange(
    matchId: number,
    side: ScoreSide,
    event: Event,
  ): void {
    const value = (event.target as HTMLInputElement).value;
    this.scoreDrafts.update((drafts) => ({
      ...drafts,
      [matchId]: {
        ...this.getScoreDraft(matchId),
        [side]: value,
      },
    }));
  }

  public onDateChange(key: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dateDrafts.update((drafts) => ({
      ...drafts,
      [key]: value,
    }));
  }

  public onLocationChange(key: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.locationDrafts.update((drafts) => ({
      ...drafts,
      [key]: value,
    }));
  }

  public getScoreDraft(matchId: number): ScoreDraft {
    return this.scoreDrafts()[matchId] ?? { home: '', away: '' };
  }

  public getDateDraft(key: string): string {
    return this.dateDrafts()[key] ?? '';
  }

  public getLocationDraft(key: string): string {
    return this.locationDrafts()[key] ?? '';
  }

  public canSaveResult(match: DetailedMatch): boolean {
    const draft = this.getScoreDraft(match.id);
    return (
      draft.home !== '' &&
      draft.away !== '' &&
      Number(draft.home) >= 0 &&
      Number(draft.away) >= 0 &&
      Number(draft.home) !== Number(draft.away) &&
      !!match.awayTeam
    );
  }

  public canSaveDate(leg: { match: DetailedMatch | null; dateDraftKey: string }): boolean {
    return !!leg.match && this.getDateDraft(leg.dateDraftKey) !== '';
  }

  public canSaveLocation(leg: {
    match: DetailedMatch | null;
    locationDraftKey: string;
  }): boolean {
    return (
      !!leg.match && this.getLocationDraft(leg.locationDraftKey).length <= 100
    );
  }

  public getLegLocation(leg: {
    match: DetailedMatch | null;
    homeTeam: Team | null;
  }): string | null {
    return leg.match?.location ?? leg.homeTeam?.arena ?? null;
  }

  public async onSaveMatchDate(match: DetailedMatch, dateDraftKey: string): Promise<void> {
    const competition = this.competitionStore.competition();
    const phase = this.playoffPhase();
    const group = this.playoffGroup();
    const date = this.getApiDateDraft(dateDraftKey);

    if (!competition || !phase || !group) {
      return;
    }

    this.isSaving.set(true);
    try {
      await firstValueFrom(
        this.adminMatchService.updateMatch({
          competitionId: competition.id,
          phaseId: phase.id,
          groupId: group.id,
          match: {
            id: match.id,
            roundId: match.round.id,
            homeTeamId: match.homeTeam.id,
            awayTeamId: match.awayTeam?.id,
            noShowTeamId: match.noShowTeam?.id ?? null,
            status: match.status,
            date,
            location: match.location ?? match.homeTeam.arena ?? null,
            homeTeamScore: match.homeTeamScore,
            awayTeamScore: match.awayTeamScore,
          },
        }),
      );
      this.refreshCompetition();
      this.snackBar.open('Fecha guardada correctamente', 'Cerrar', {
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al guardar la fecha', 'Cerrar');
    } finally {
      this.isSaving.set(false);
    }
  }

  public async onSaveMatchLocation(
    match: DetailedMatch,
    locationDraftKey: string,
  ): Promise<void> {
    const competition = this.competitionStore.competition();
    const phase = this.playoffPhase();
    const group = this.playoffGroup();
    const location = this.getLocationDraftValue(
      locationDraftKey,
      match.homeTeam.arena,
    );

    if (!competition || !phase || !group) {
      return;
    }

    this.isSaving.set(true);
    try {
      await firstValueFrom(
        this.adminMatchService.updateMatch({
          competitionId: competition.id,
          phaseId: phase.id,
          groupId: group.id,
          match: {
            id: match.id,
            roundId: match.round.id,
            homeTeamId: match.homeTeam.id,
            awayTeamId: match.awayTeam?.id,
            noShowTeamId: match.noShowTeam?.id ?? null,
            status: match.status,
            date: match.date ? match.date.toISOString() : null,
            location,
            homeTeamScore: match.homeTeamScore,
            awayTeamScore: match.awayTeamScore,
          },
        }),
      );
      this.refreshCompetition();
      this.snackBar.open('Ubicación guardada correctamente', 'Cerrar', {
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al guardar la ubicación', 'Cerrar');
    } finally {
      this.isSaving.set(false);
    }
  }

  public async onSaveResult(
    round: PlayoffRoundView,
    matchView: PlayoffMatchView,
    match: DetailedMatch,
  ): Promise<void> {
    const competition = this.competitionStore.competition();
    const phase = this.playoffPhase();
    const group = this.playoffGroup();

    if (!competition || !phase || !group || !match) {
      return;
    }

    const draft = this.getScoreDraft(match.id);
    const homeTeamScore = Number(draft.home);
    const awayTeamScore = Number(draft.away);

    if (!Number.isFinite(homeTeamScore) || !Number.isFinite(awayTeamScore)) {
      return;
    }

    this.isSaving.set(true);
    try {
      await this.playoffAdminService.saveMatchResult({
        competitionId: competition.id,
        phaseId: phase.id,
        groupId: group.id,
        match,
        homeTeamScore,
        awayTeamScore,
        date: this.getApiDateDraft(`match:${match.id}`),
        location: this.getLocationDraftValue(
          `match:${match.id}`,
          match.homeTeam.arena,
        ),
      });
      await this.createNextRoundMatchIfPossible({
        round,
        matchView: this.buildMatchViewWithResult({
          matchView,
          matchId: match.id,
          homeTeamScore,
          awayTeamScore,
        }),
      });
      this.refreshCompetition();
      this.snackBar.open('Resultado guardado correctamente', 'Cerrar', {
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al guardar el resultado', 'Cerrar');
    } finally {
      this.isSaving.set(false);
    }
  }

  public async onCreateMatch(
    round: PlayoffRoundView,
    matchView: PlayoffMatchView,
  ): Promise<void> {
    const competition = this.competitionStore.competition();
    const phase = this.playoffPhase();
    const group = this.playoffGroup();

    if (
      !competition ||
      !phase ||
      !group ||
      !round.round ||
      !matchView.homeTeam
    ) {
      return;
    }

    this.isSaving.set(true);
    try {
      await this.createMatchLegs({
        competitionId: competition.id,
        phaseId: phase.id,
        groupId: group.id,
        roundId: round.round.id,
        matchView,
      });
      this.refreshCompetition();
      this.snackBar.open('Partido creado correctamente', 'Cerrar', {
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al crear el partido', 'Cerrar');
    } finally {
      this.isSaving.set(false);
    }
  }

  private syncSeedSlotsFromCompetition(): void {
    const competition = this.competitionStore.competition();
    const phase = this.playoffPhase();
    const sourceTeams = this.sourceTeams();

    if (!competition || !phase || sourceTeams.length === 0) {
      this.seedSlots.set([]);
      this.loadedSeedKey.set(null);
      return;
    }

    const teamsById = new Map(sourceTeams.map((team) => [team.id, team]));
    const sourceTeamIds = sourceTeams.map((team) => team.id);
    const bracketSize = PLAYOFF_BRACKET_SIZE;
    const openingRound = this.getOpeningRoundMatches(phase);
    const roundNames = getPlayoffRoundNames(this.teamCount());
    const openingLegCount = getPlayoffLegCount(0, roundNames.length);
    const openingFirstLegs = this.getFirstLegs(openingRound, openingLegCount);
    const persistedSeedIds = openingFirstLegs.flatMap((match) => [
      match.homeTeam.id,
      match.awayTeam?.id ?? null,
    ]);
    const persistedTeamIds = persistedSeedIds.filter(
      (teamId): teamId is number => !!teamId && sourceTeamIds.includes(teamId),
    );
    const missingPersistedTeamIds = sourceTeamIds
      .filter((teamId) => !persistedTeamIds.includes(teamId));
    const filteredPersistedSeedIds = persistedSeedIds.map((teamId) =>
      teamId && sourceTeamIds.includes(teamId) ? teamId : null,
    );
    const teamIds =
      filteredPersistedSeedIds.length > 0
        ? [...filteredPersistedSeedIds, ...missingPersistedTeamIds]
        : sourceTeamIds;
    const selectedLeagueGroup = this.selectedLeagueGroup();
    const seedKey = `${phase.id}:${selectedLeagueGroup?.id}:${teamIds.join(',')}`;

    if (seedKey === this.loadedSeedKey()) {
      return;
    }

    const slots = Array.from({ length: bracketSize }, (_, index) => ({
      seed: index + 1,
      team: teamIds[index] ? teamsById.get(teamIds[index]!) ?? null : null,
    }));

    this.seedSlots.set(slots);
    this.loadedSeedKey.set(seedKey);
  }

  private async createMatchLegs({
    competitionId,
    phaseId,
    groupId,
    roundId,
    matchView,
  }: {
    competitionId: number;
    phaseId: number;
    groupId: number;
    roundId: number;
    matchView: PlayoffMatchView;
  }): Promise<void> {
    const firstLeg = matchView.legs[0];
    if (!firstLeg?.homeTeam) {
      return;
    }

    await this.playoffAdminService.createMatch({
      competitionId,
      phaseId,
      groupId,
      roundId,
      homeTeamId: firstLeg.homeTeam.id,
      awayTeamId: firstLeg.awayTeam?.id,
      date: this.getApiDateDraft(firstLeg.dateDraftKey),
      location: this.getLocationDraftValue(
        firstLeg.locationDraftKey,
        firstLeg.homeTeam.arena,
      ),
    });

    const secondLeg = matchView.legs[1];
    if (!matchView.isTwoLegged || !secondLeg?.homeTeam) {
      return;
    }

    await this.playoffAdminService.createMatch({
      competitionId,
      phaseId,
      groupId,
      roundId,
      homeTeamId: secondLeg.homeTeam.id,
      awayTeamId: secondLeg.awayTeam?.id,
      date: this.getApiDateDraft(secondLeg.dateDraftKey),
      location: this.getLocationDraftValue(
        secondLeg.locationDraftKey,
        secondLeg.homeTeam.arena,
      ),
    });
  }

  private syncScoreDraftsFromMatches(): void {
    const drafts: Record<number, ScoreDraft> = {};

    for (const round of this.bracketRounds()) {
      for (const matchView of round.matches) {
        for (const leg of matchView.legs) {
          const match = leg.match;
          if (!match) {
            continue;
          }

          drafts[match.id] = {
            home: match.homeTeamScore?.toString() ?? '',
            away: match.awayTeamScore?.toString() ?? '',
          };
        }
      }
    }

    this.scoreDrafts.set(drafts);
  }

  private syncDateDraftsFromMatches(): void {
    this.dateDrafts.update((currentDrafts) => {
      const drafts = { ...currentDrafts };

      for (const round of this.bracketRounds()) {
        for (const matchView of round.matches) {
          for (const leg of matchView.legs) {
            if (!leg.match) {
              drafts[leg.dateDraftKey] ??= '';
              continue;
            }

            drafts[leg.dateDraftKey] = this.toDateInputValue(leg.match.date);
          }
        }
      }

      return drafts;
    });
  }

  private syncLocationDraftsFromMatches(): void {
    this.locationDrafts.update((currentDrafts) => {
      const drafts = { ...currentDrafts };

      for (const round of this.bracketRounds()) {
        for (const matchView of round.matches) {
          for (const leg of matchView.legs) {
            if (!leg.match) {
              drafts[leg.locationDraftKey] = leg.homeTeam?.arena ?? '';
              continue;
            }

            drafts[leg.locationDraftKey] =
              leg.match.location ?? leg.match.homeTeam.arena ?? '';
          }
        }
      }

      return drafts;
    });
  }

  private buildMatchView({
    savedMatches,
    matchIndex,
    roundIndex,
    roundCount,
    homeTeam,
    awayTeam,
  }: {
    savedMatches: DetailedMatch[];
    matchIndex: number;
    roundIndex: number;
    roundCount: number;
    homeTeam: Team | null;
    awayTeam: Team | null;
  }): PlayoffMatchView {
    const resolvedHomeTeam = savedMatches[0]?.homeTeam ?? homeTeam;
    const resolvedAwayTeam = savedMatches[0]?.awayTeam ?? awayTeam;
    const shouldUseTwoLegs =
      this.getExpectedLegCount({
        roundIndex,
        roundCount,
        homeTeam: resolvedHomeTeam,
        awayTeam: resolvedAwayTeam,
      }) === 2;
    const legCount = shouldUseTwoLegs ? 2 : 1;
    const legs = Array.from({ length: legCount }, (_, legIndex) => {
      const savedMatch = savedMatches[legIndex] ?? null;
      const isSecondLeg = legIndex === 1;

      return {
        index: legIndex,
        match: savedMatch,
        homeTeam:
          savedMatch?.homeTeam ??
          (isSecondLeg ? resolvedAwayTeam : resolvedHomeTeam),
        awayTeam:
          savedMatch?.awayTeam ??
          (isSecondLeg ? resolvedHomeTeam : resolvedAwayTeam),
        dateDraftKey: savedMatch
          ? `match:${savedMatch.id}`
          : `planned:${roundIndex}:${matchIndex}:${legIndex}`,
        locationDraftKey: savedMatch
          ? `match:${savedMatch.id}`
          : `planned:${roundIndex}:${matchIndex}:${legIndex}`,
      };
    });
    const aggregate = this.getAggregateScore({
      legs,
      homeTeam: resolvedHomeTeam,
      awayTeam: resolvedAwayTeam,
    });

    return {
      index: matchIndex,
      legs,
      homeTeam: resolvedHomeTeam,
      awayTeam: resolvedAwayTeam,
      winner: this.getTieWinner({
        legs,
        homeTeam: resolvedHomeTeam,
        awayTeam: resolvedAwayTeam,
        isTwoLegged: shouldUseTwoLegs,
      }),
      isTwoLegged: shouldUseTwoLegs,
      aggregateHomeScore: aggregate?.home ?? null,
      aggregateAwayScore: aggregate?.away ?? null,
    };
  }

  private buildMatchViewWithResult({
    matchView,
    matchId,
    homeTeamScore,
    awayTeamScore,
  }: {
    matchView: PlayoffMatchView;
    matchId: number;
    homeTeamScore: number;
    awayTeamScore: number;
  }): PlayoffMatchView {
    const legs = matchView.legs.map((leg) => {
      if (!leg.match || leg.match.id !== matchId) {
        return leg;
      }

      return {
        ...leg,
        match: {
          ...leg.match,
          status: 'Finished' as const,
          homeTeamScore,
          awayTeamScore,
        },
      };
    });
    const aggregate = this.getAggregateScore({
      legs,
      homeTeam: matchView.homeTeam,
      awayTeam: matchView.awayTeam,
    });

    return {
      ...matchView,
      legs,
      winner: this.getTieWinner({
        legs,
        homeTeam: matchView.homeTeam,
        awayTeam: matchView.awayTeam,
        isTwoLegged: matchView.isTwoLegged,
      }),
      aggregateHomeScore: aggregate?.home ?? null,
      aggregateAwayScore: aggregate?.away ?? null,
    };
  }

  private async createNextRoundMatchIfPossible({
    round,
    matchView,
  }: {
    round: PlayoffRoundView;
    matchView: PlayoffMatchView;
  }): Promise<void> {
    const nextRound = this.bracketRounds()[round.index + 1];
    const winner = matchView.winner;

    if (!nextRound?.round || !winner) {
      return;
    }

    const targetMatchIndex = Math.floor(matchView.index / 2);
    const targetMatch = nextRound.matches[targetMatchIndex];
    const existingMatches =
      targetMatch?.legs
        .map((leg) => leg.match)
        .filter((match): match is DetailedMatch => !!match) ?? [];
    const existingMatch = existingMatches[0];
    const homeTeamId =
      matchView.index % 2 === 0
        ? winner.id
        : existingMatch?.homeTeam.id ?? targetMatch?.homeTeam?.id ?? winner.id;
    const awayTeamId =
      matchView.index % 2 === 1
        ? winner.id
        : existingMatch?.awayTeam?.id ??
          this.getPendingAwayTeamId(existingMatch, winner) ??
          targetMatch?.awayTeam?.id;

    if (!homeTeamId) {
      return;
    }

    if (!awayTeamId) {
      return;
    }

    if (existingMatches.length > 0) {
      const isTwoLegged = targetMatch?.isTwoLegged ?? false;
      const desiredMatches = isTwoLegged ? 2 : 1;

      for (let legIndex = 0; legIndex < desiredMatches; legIndex++) {
        const match = existingMatches[legIndex];
        if (!match) {
          continue;
        }
        const isSecondLeg = legIndex === 1;
        const legHomeTeamId = isSecondLeg && awayTeamId ? awayTeamId : homeTeamId;
        const legAwayTeamId = isSecondLeg ? homeTeamId : awayTeamId;
        const legHomeTeam = this.getTeamById(legHomeTeamId);
        const location =
          match.homeTeam.id === legHomeTeamId
            ? match.location ?? legHomeTeam?.arena ?? null
            : legHomeTeam?.arena ?? null;

        await firstValueFrom(
          this.adminMatchService.updateMatch({
            competitionId: this.competitionStore.competition()!.id,
            phaseId: this.playoffPhase()!.id,
            groupId: this.playoffGroup()!.id,
            match: {
              id: match.id,
              roundId: nextRound.round.id,
              homeTeamId: legHomeTeamId,
              awayTeamId: legAwayTeamId,
              noShowTeamId: null,
              status: legAwayTeamId ? 'NotStarted' : 'Rest',
              date: match.date ? match.date.toISOString() : null,
              location,
              homeTeamScore: null,
              awayTeamScore: null,
            },
          }),
        );
      }
      return;
    }

    if (targetMatch?.isTwoLegged && awayTeamId) {
      await this.playoffAdminService.createMatch({
        competitionId: this.competitionStore.competition()!.id,
        phaseId: this.playoffPhase()!.id,
        groupId: this.playoffGroup()!.id,
        roundId: nextRound.round.id,
        homeTeamId,
        awayTeamId,
        date: this.getApiDateDraft(targetMatch.legs[0].dateDraftKey),
        location: this.getLocationDraftValue(
          targetMatch.legs[0].locationDraftKey,
          this.getTeamById(homeTeamId)?.arena,
        ),
      });
      await this.playoffAdminService.createMatch({
        competitionId: this.competitionStore.competition()!.id,
        phaseId: this.playoffPhase()!.id,
        groupId: this.playoffGroup()!.id,
        roundId: nextRound.round.id,
        homeTeamId: awayTeamId,
        awayTeamId: homeTeamId,
        date: this.getApiDateDraft(targetMatch.legs[1].dateDraftKey),
        location: this.getLocationDraftValue(
          targetMatch.legs[1].locationDraftKey,
          this.getTeamById(awayTeamId)?.arena,
        ),
      });
      return;
    }

    await this.playoffAdminService.createMatch({
      competitionId: this.competitionStore.competition()!.id,
      phaseId: this.playoffPhase()!.id,
      groupId: this.playoffGroup()!.id,
      roundId: nextRound.round.id,
      homeTeamId,
      awayTeamId,
      date: targetMatch
        ? this.getApiDateDraft(targetMatch.legs[0].dateDraftKey)
        : null,
      location: targetMatch
        ? this.getLocationDraftValue(
            targetMatch.legs[0].locationDraftKey,
            this.getTeamById(homeTeamId)?.arena,
          )
        : null,
    });
  }

  private getTieWinner({
    legs,
    homeTeam,
    awayTeam,
    isTwoLegged,
  }: {
    legs: PlayoffMatchView['legs'];
    homeTeam: Team | null;
    awayTeam: Team | null;
    isTwoLegged: boolean;
  }): Team | null {
    if (homeTeam && !awayTeam) {
      return homeTeam;
    }

    if (!homeTeam || !awayTeam) {
      return null;
    }

    if (!isTwoLegged) {
      return legs[0]?.match ? getMatchWinner(legs[0].match) : null;
    }

    const aggregate = this.getAggregateScore({ legs, homeTeam, awayTeam });
    if (!aggregate) {
      return null;
    }

    if (aggregate.home > aggregate.away) {
      return homeTeam;
    }

    if (aggregate.away > aggregate.home) {
      return awayTeam;
    }

    return null;
  }

  private getAggregateScore({
    legs,
    homeTeam,
    awayTeam,
  }: {
    legs: PlayoffMatchView['legs'];
    homeTeam: Team | null;
    awayTeam: Team | null;
  }): { home: number; away: number } | null {
    if (!homeTeam || !awayTeam || legs.some((leg) => !leg.match)) {
      return null;
    }

    let home = 0;
    let away = 0;

    for (const leg of legs) {
      const match = leg.match;
      if (
        !match ||
        match.homeTeamScore === null ||
        match.homeTeamScore === undefined ||
        match.awayTeamScore === null ||
        match.awayTeamScore === undefined
      ) {
        return null;
      }

      if (match.homeTeam.id === homeTeam.id) {
        home += match.homeTeamScore;
        away += match.awayTeamScore;
      } else {
        home += match.awayTeamScore;
        away += match.homeTeamScore;
      }
    }

    return { home, away };
  }

  private getApiDateDraft(key: string): string | null {
    const draft = this.getDateDraft(key);
    if (!draft) {
      return null;
    }

    const date = new Date(draft);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  }

  private getLocationDraftValue(
    key: string,
    fallbackLocation?: string | null,
  ): string | null {
    const location = this.getLocationDraft(key).trim();
    return location.length > 0 ? location : fallbackLocation?.trim() || null;
  }

  private toDateInputValue(date: Date | null | undefined): string {
    if (!date) {
      return '';
    }

    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  }

  private getPendingAwayTeamId(
    existingMatch: DetailedMatch | null | undefined,
    winner: Team,
  ): number | undefined {
    if (!existingMatch || existingMatch.homeTeam.id === winner.id) {
      return undefined;
    }

    return existingMatch.homeTeam.id;
  }

  private getExpectedLegCount({
    roundIndex,
    roundCount,
    homeTeam,
    awayTeam,
  }: {
    roundIndex: number;
    roundCount: number;
    homeTeam: Team | null;
    awayTeam: Team | null;
  }): number {
    return getPlayoffLegCount(roundIndex, roundCount) === 2 &&
      (!!awayTeam || roundIndex > 0 || !homeTeam)
      ? 2
      : 1;
  }

  private getFirstLegs(
    matches: DetailedMatch[],
    openingLegCount: number,
  ): DetailedMatch[] {
    if (openingLegCount === 1) {
      return matches;
    }

    const firstLegs: DetailedMatch[] = [];
    for (let index = 0; index < matches.length; index++) {
      const match = matches[index];
      const nextMatch = matches[index + 1];
      firstLegs.push(match);

      if (
        nextMatch &&
        match.homeTeam.id === nextMatch.awayTeam?.id &&
        match.awayTeam?.id === nextMatch.homeTeam.id
      ) {
        index++;
      }
    }

    return firstLegs;
  }

  private getTeamById(teamId: number): Team | null {
    return (
      this.competitionStore
        .competition()
        ?.teams.find((team) => team.id === teamId) ?? null
    );
  }

  private isPlayoffTeamMatch(
    match: DetailedMatch,
    playoffTeamIds: Set<number>,
  ): boolean {
    return (
      playoffTeamIds.has(match.homeTeam.id) &&
      (!match.awayTeam || playoffTeamIds.has(match.awayTeam.id))
    );
  }

  private refreshCompetition(): void {
    const competitionId = this.competitionStore.competition()?.id;
    if (competitionId) {
      this.dispatcher.dispatch(competitionEvents.getCompetition(competitionId));
    }
  }

  private getOpeningRoundMatches(phase: Phase): DetailedMatch[] {
    const group = this.playoffGroup();
    const openingRoundName = getPlayoffRoundNames(this.teamCount())[0];
    const openingRound =
      phase?.rounds.find((round) => round.name === openingRoundName) ??
      phase?.rounds[0];

    if (!group || !openingRound) {
      return [];
    }

    return sortPlayoffMatches(
      group.matches.filter((match) => match.round.id === openingRound.id),
    );
  }
}
