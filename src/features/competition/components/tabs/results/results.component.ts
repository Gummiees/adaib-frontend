import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { MatchComponent } from '@shared/components/match/match.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { DetailedCompetition } from '@shared/models/competition';
import { Group } from '@shared/models/group';
import { Phase } from '@shared/models/phase';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatchComponent, NotFoundComponent],
})
export class ResultsComponent {
  public competition = input.required<DetailedCompetition>();
  public phaseFilter = signal<Phase | null>(null);
  public groupFilter = signal<Group | null>(null);
  public roundFilter = signal<number | null>(null);

  public filteredCompetition = computed<DetailedCompetition>(() => {
    const competition = this.competition();
    let filteredCompetition = { ...competition };
    const phaseFilter = this.phaseFilter();
    const groupFilter = this.groupFilter();
    const roundFilter = this.roundFilter();
    if (phaseFilter || groupFilter || roundFilter) {
      if (phaseFilter) {
        filteredCompetition = {
          ...filteredCompetition,
          phases: competition.phases.filter(
            (phase) => phase.id === phaseFilter.id,
          ),
        };
      }
      if (groupFilter) {
        filteredCompetition = {
          ...filteredCompetition,
          phases: filteredCompetition.phases.map((phase) => ({
            ...phase,
            groups: phase.groups.filter((group) => group.id === groupFilter.id),
          })),
        };
      }
      if (roundFilter) {
        filteredCompetition = {
          ...filteredCompetition,
          phases: filteredCompetition.phases.map((phase) => ({
            ...phase,
            groups: phase.groups.map((group) => ({
              ...group,
              matches: group.matches.filter(
                (match) => match.round === roundFilter,
              ),
            })),
          })),
        };
      }
    }
    return filteredCompetition;
  });

  public availablePhases = computed<Phase[]>(() => {
    return [
      ...new Set(
        this.competition().phases.filter((phase) =>
          phase.groups.some((group) => group.matches.length > 0),
        ),
      ),
    ];
  });

  public availableGroups = computed<Group[]>(() => {
    return [
      ...new Set(
        this.competition().phases.flatMap((phase) =>
          phase.groups.filter((group) => group.matches.length > 0),
        ),
      ),
    ];
  });

  public availableRounds = computed<number[]>(() => {
    return [
      ...new Set(
        this.competition().phases.flatMap((phase) =>
          phase.groups.flatMap((group) =>
            group.matches.map((match) => match.round),
          ),
        ),
      ),
    ];
  });
}
