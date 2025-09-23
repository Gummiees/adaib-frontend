import { Injectable, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DetailedCompetition } from '@shared/models/competition';
import { Group } from '@shared/models/group';
import { Phase } from '@shared/models/phase';
import { Round } from '@shared/models/round';

@Injectable()
export class MatchFormRouteService {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  preSelectFromQueryParams(
    competition: DetailedCompetition,
    form: FormGroup,
  ): void {
    const queryParams = this.activatedRoute.snapshot.queryParams;
    const faseId = queryParams['fase'];
    const grupoId = queryParams['grupo'];
    const jornadaId = queryParams['jornada'];

    // If all three parameters are provided, use existing logic
    if (faseId) {
      const phase = this.findPhase(competition, faseId);
      if (!phase) {
        return;
      }
      form.patchValue({ phaseId: phase.id });
      // Pre-select group and round if provided
      this.preSelectGroup(phase, grupoId, form);
      this.preSelectRound(phase, jornadaId, form);
      return;
    }

    // If no phase but group and/or round are provided, search for them
    if (grupoId || jornadaId) {
      this.handleMissingPhaseQueryParam(competition, grupoId, jornadaId, form);
    }
  }

  processCurrentQueryParams(
    competition: DetailedCompetition,
    form: FormGroup,
  ): void {
    if (competition) {
      this.preSelectFromQueryParams(competition, form);
    }
  }

  navigateToCompetition(competitionId: number): void {
    if (competitionId) {
      this.router.navigate(['/competiciones', competitionId], {
        queryParams: { tab: 'resultados' },
      });
    }
  }

  navigateToMatch(
    competitionId: number,
    matchId: number,
    phase: Phase,
    group: Group,
    round: Round,
  ): void {
    // Update the browser URL without navigation to reflect edit mode
    window.history.replaceState(
      {},
      '',
      `/admin/competicion/${competitionId}/partido/${matchId}?fase=${phase.id}&grupo=${group.id}&jornada=${round.id}`,
    );
  }

  navigateToCreateMatch(
    competitionId: number,
    preservedParams: {
      selectedPhaseId?: number | null;
      selectedGroupId?: number | null;
      selectedRoundId?: number | null;
      currentQueryParams: Params;
    },
  ): void {
    const queryParams: Params = {};

    // Preserve phase
    if (preservedParams.selectedPhaseId) {
      queryParams['fase'] = preservedParams.selectedPhaseId.toString();
    } else if (preservedParams.currentQueryParams['fase']) {
      queryParams['fase'] = preservedParams.currentQueryParams['fase'];
    }

    // Preserve group
    if (preservedParams.selectedGroupId) {
      queryParams['grupo'] = preservedParams.selectedGroupId.toString();
    } else if (preservedParams.currentQueryParams['grupo']) {
      queryParams['grupo'] = preservedParams.currentQueryParams['grupo'];
    }

    // Preserve round
    if (preservedParams.selectedRoundId) {
      queryParams['jornada'] = preservedParams.selectedRoundId.toString();
    } else if (preservedParams.currentQueryParams['jornada']) {
      queryParams['jornada'] = preservedParams.currentQueryParams['jornada'];
    }

    this.router.navigate(['/admin/competicion', competitionId, 'partido'], {
      queryParams,
    });
  }

  navigateToEditPhase(competitionId: number, phaseId: number): void {
    this.router.navigate([
      '/admin/competicion',
      competitionId,
      'fase',
      phaseId,
    ]);
  }

  navigateToEditGroup(
    competitionId: number,
    groupId: number,
    phaseId?: number,
  ): void {
    const queryParams: Params = {};
    if (phaseId) {
      queryParams['fase'] = phaseId;
    }
    this.router.navigate(
      ['/admin/competicion', competitionId, 'grupo', groupId],
      { queryParams },
    );
  }

  navigateToEditRound(
    competitionId: number,
    roundId: number,
    phaseId?: number,
  ): void {
    const queryParams: Params = {};
    if (phaseId) {
      queryParams['fase'] = phaseId;
    }
    this.router.navigate(
      ['/admin/competicion', competitionId, 'jornada', roundId],
      { queryParams },
    );
  }

  private handleMissingPhaseQueryParam(
    competition: DetailedCompetition,
    grupoId: string | undefined,
    jornadaId: string | undefined,
    form: FormGroup,
  ): void {
    // Parse IDs if provided
    const parsedGrupoId = grupoId ? Number(grupoId) : null;
    const parsedJornadaId = jornadaId ? Number(jornadaId) : null;

    // Validate parsed IDs
    if (grupoId && (isNaN(parsedGrupoId!) || parsedGrupoId === null)) {
      console.warn('Invalid grupo ID in query params:', grupoId);
      return;
    }
    if (jornadaId && (isNaN(parsedJornadaId!) || parsedJornadaId === null)) {
      console.warn('Invalid jornada ID in query params:', jornadaId);
      return;
    }

    // Case 1: Both group and round are provided - find phase that contains both
    if (parsedGrupoId !== null && parsedJornadaId !== null) {
      const foundPhase = this.findPhaseWithGroupAndRound(
        competition,
        parsedGrupoId,
        parsedJornadaId,
      );
      if (foundPhase) {
        this.selectPhaseGroupAndRound(
          foundPhase.phase,
          foundPhase.group,
          foundPhase.round,
          form,
        );
      }
      return;
    }

    // Case 2: Only group is provided - find phase that contains this group
    if (parsedGrupoId !== null) {
      const foundPhase = this.findPhaseWithGroup(competition, parsedGrupoId);
      if (foundPhase) {
        this.selectPhaseAndGroup(foundPhase.phase, foundPhase.group, form);
      }
      return;
    }

    // Case 3: Only round is provided - find phase that contains this round
    if (parsedJornadaId !== null) {
      const foundPhase = this.findPhaseWithRound(competition, parsedJornadaId);
      if (foundPhase) {
        this.selectPhaseAndRound(foundPhase.phase, foundPhase.round, form);
      }
    }
  }

  private findPhase(
    competition: DetailedCompetition,
    faseId: string,
  ): Phase | null {
    const parsedFaseId = Number(faseId);
    if (isNaN(parsedFaseId)) {
      console.warn('Invalid fase ID in query params:', faseId);
      return null;
    }

    const phase = competition.phases.find((p: Phase) => p.id === parsedFaseId);
    if (!phase) {
      console.warn(
        'Phase with ID',
        parsedFaseId,
        'not found in competition phases',
      );
      return null;
    }

    // Pre-select phase
    return phase;
  }

  private preSelectGroup(
    phase: Phase,
    grupoId: string | undefined,
    form: FormGroup,
  ): void {
    if (!grupoId) {
      return;
    }

    const parsedGrupoId = Number(grupoId);
    if (isNaN(parsedGrupoId)) {
      console.warn('Invalid grupo ID in query params:', grupoId);
      return;
    }

    const group = phase.groups.find((g: Group) => g.id === parsedGrupoId);
    if (group) {
      form.patchValue({ groupId: group.id });
    } else {
      console.warn('Group with ID', parsedGrupoId, 'not found in phase groups');
    }
  }

  private preSelectRound(
    phase: Phase,
    jornadaId: string | undefined,
    form: FormGroup,
  ): void {
    if (!jornadaId) {
      return;
    }

    const parsedJornadaId = Number(jornadaId);
    if (isNaN(parsedJornadaId)) {
      console.warn('Invalid jornada ID in query params:', jornadaId);
      return;
    }

    const round = phase.rounds.find((r: Round) => r.id === parsedJornadaId);
    if (round) {
      form.patchValue({ roundId: round.id });
    } else {
      console.warn(
        'Round with ID',
        parsedJornadaId,
        'not found in phase rounds',
      );
    }
  }

  // Helper methods for finding phases that contain specific groups and rounds
  private findPhaseWithGroupAndRound(
    competition: DetailedCompetition,
    groupId: number,
    roundId: number,
  ): { phase: Phase; group: Group; round: Round } | null {
    for (const phase of competition.phases) {
      const group = phase.groups.find((g: Group) => g.id === groupId);
      const round = phase.rounds.find((r: Round) => r.id === roundId);

      if (group && round) {
        return { phase, group, round };
      }
    }
    return null;
  }

  private findPhaseWithGroup(
    competition: DetailedCompetition,
    groupId: number,
  ): { phase: Phase; group: Group } | null {
    for (const phase of competition.phases) {
      const group = phase.groups.find((g: Group) => g.id === groupId);
      if (group) {
        return { phase, group };
      }
    }
    return null;
  }

  private findPhaseWithRound(
    competition: DetailedCompetition,
    roundId: number,
  ): { phase: Phase; round: Round } | null {
    for (const phase of competition.phases) {
      const round = phase.rounds.find((r: Round) => r.id === roundId);
      if (round) {
        return { phase, round };
      }
    }
    return null;
  }

  // Helper methods for selecting found phase/group/round combinations
  private selectPhaseGroupAndRound(
    phase: Phase,
    group: Group,
    round: Round,
    form: FormGroup,
  ): void {
    form.patchValue({
      phaseId: phase.id,
      groupId: group.id,
      roundId: round.id,
    });
  }

  private selectPhaseAndGroup(
    phase: Phase,
    group: Group,
    form: FormGroup,
  ): void {
    form.patchValue({
      phaseId: phase.id,
      groupId: group.id,
    });
  }

  private selectPhaseAndRound(
    phase: Phase,
    round: Round,
    form: FormGroup,
  ): void {
    form.patchValue({
      phaseId: phase.id,
      roundId: round.id,
    });
  }
}
