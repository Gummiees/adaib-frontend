import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CompetitionStatus } from '../../models/competition';
import { CompetitionProgressComponent } from './competition-progress.component';

describe('CompetitionProgressComponent', () => {
  let component: CompetitionProgressComponent;
  let fixture: ComponentFixture<CompetitionProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompetitionProgressComponent, MatProgressBarModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CompetitionProgressComponent);
    component = fixture.componentInstance;
  });

  const setInputs = (overrides: {
    status?: CompetitionStatus;
    startDate?: Date | null;
    endDate?: Date | null;
  }) => {
    fixture.componentRef.setInput('status', overrides.status);
    fixture.componentRef.setInput('startDate', overrides.startDate);
    fixture.componentRef.setInput('endDate', overrides.endDate);
  };

  describe('Progress Calculation', () => {
    describe('NotStarted status', () => {
      it('should return 1% progress for NotStarted status', () => {
        setInputs({
          status: 'NotStarted',
          startDate: null,
          endDate: null,
        });

        expect(component.progress()).toBe(1);
      });
    });

    describe('Finished status', () => {
      it('should return 100% progress for Finished status', () => {
        setInputs({
          status: 'Finished',
          startDate: null,
          endDate: null,
        });

        expect(component.progress()).toBe(100);
      });
    });

    describe('Ongoing status', () => {
      beforeEach(() => {
        // Mock current date to a fixed value for consistent testing
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should return 1% progress when startDate is null', () => {
        setInputs({
          status: 'Ongoing',
          startDate: null,
          endDate: new Date('2024-06-20T12:00:00Z'),
        });

        expect(component.progress()).toBe(1);
      });

      it('should return 1% progress when endDate is null', () => {
        setInputs({
          status: 'Ongoing',
          startDate: new Date('2024-06-10T12:00:00Z'),
          endDate: null,
        });

        expect(component.progress()).toBe(1);
      });

      it('should return 1% progress when both dates are null', () => {
        setInputs({
          status: 'Ongoing',
          startDate: null,
          endDate: null,
        });

        expect(component.progress()).toBe(1);
      });

      it('should return 1% progress when startDate is in the future', () => {
        setInputs({
          status: 'Ongoing',
          startDate: new Date('2024-06-20T12:00:00Z'),
          endDate: new Date('2024-06-25T12:00:00Z'),
        });

        expect(component.progress()).toBe(1);
      });

      it('should return 100% progress when startDate is after endDate', () => {
        setInputs({
          status: 'Ongoing',
          startDate: new Date('2024-06-10T12:00:00Z'),
          endDate: new Date('2024-06-05T12:00:00Z'),
        });

        expect(component.progress()).toBe(100);
      });
      it('should return 100% progress when endDate is in the past', () => {
        setInputs({
          status: 'Ongoing',
          startDate: new Date('2024-06-10T12:00:00Z'),
          endDate: new Date('2024-06-14T12:00:00Z'),
        });

        expect(component.progress()).toBe(100);
      });

      it('should calculate correct progress percentage for ongoing competition', () => {
        setInputs({
          status: 'Ongoing',
          startDate: new Date('2024-06-10T12:00:00Z'),
          endDate: new Date('2024-06-20T12:00:00Z'),
        });

        // Current time is 2024-06-15T12:00:00Z
        // Elapsed: 5 days, Total duration: 10 days
        // Progress should be 50%
        expect(component.progress()).toBe(50);
      });

      it('should calculate correct progress percentage at the start of competition', () => {
        setInputs({
          status: 'Ongoing',
          startDate: new Date('2024-06-15T12:00:00Z'),
          endDate: new Date('2024-06-25T12:00:00Z'),
        });

        // Progress should be 0% at the start
        expect(component.progress()).toBe(0);
      });

      it('should calculate correct progress percentage near the end of competition', () => {
        setInputs({
          status: 'Ongoing',
          startDate: new Date('2024-06-10T12:00:00Z'),
          endDate: new Date('2024-06-16T12:00:00Z'),
        });

        // Current time is 2024-06-15T12:00:00Z
        // Elapsed: 5 days, Total duration: 6 days
        // Progress should be approximately 83.33%
        expect(component.progress()).toBeCloseTo(83.33, 1);
      });

      it('should return 0% when current time equals start time', () => {
        setInputs({
          status: 'Ongoing',
          startDate: new Date('2024-06-15T12:00:00Z'),
          endDate: new Date('2024-06-25T12:00:00Z'),
        });

        expect(component.progress()).toBe(0);
      });

      it('should return 100% when current time equals end time', () => {
        setInputs({
          status: 'Ongoing',
          startDate: new Date('2024-06-10T12:00:00Z'),
          endDate: new Date('2024-06-15T12:00:00Z'),
        });

        expect(component.progress()).toBe(100);
      });

      it('should handle very short duration competitions', () => {
        setInputs({
          status: 'Ongoing',
          startDate: new Date('2024-06-15T11:59:00Z'),
          endDate: new Date('2024-06-15T12:01:00Z'),
        });

        // Current time is 2024-06-15T12:00:00Z
        // Elapsed: 1 minute, Total duration: 2 minutes
        // Progress should be 50%
        expect(component.progress()).toBe(50);
      });

      it('should handle very long duration competitions', () => {
        setInputs({
          status: 'Ongoing',
          startDate: new Date('2024-01-01T12:00:00Z'),
          endDate: new Date('2024-12-31T12:00:00Z'),
        });

        // Current time is 2024-06-15T12:00:00Z
        // This should calculate a reasonable progress percentage
        const progress = component.progress();
        expect(progress).toBeGreaterThan(0);
        expect(progress).toBeLessThan(100);
      });
    });
  });

  describe('Status Class Calculation', () => {
    it('should return correct class for NotStarted status', () => {
      setInputs({ status: 'NotStarted' });
      expect(component.statusClass()).toBe('status-not-started');
    });

    it('should return correct class for Ongoing status', () => {
      setInputs({ status: 'Ongoing' });
      expect(component.statusClass()).toBe('status-ongoing');
    });

    it('should return correct class for Finished status', () => {
      setInputs({ status: 'Finished' });
      expect(component.statusClass()).toBe('status-finished');
    });

    it('should return default class for unknown status', () => {
      setInputs({ status: 'Unknown' as CompetitionStatus });
      expect(component.statusClass()).toBe('status-not-started');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should handle same start and end date', () => {
      setInputs({
        status: 'Ongoing',
        startDate: new Date('2024-06-15T12:00:00Z'),
        endDate: new Date('2024-06-15T12:00:00Z'),
      });

      // When start and end dates are the same, should return 50% progress
      expect(component.progress()).toBe(50);
    });

    it('should handle very small time differences', () => {
      setInputs({
        status: 'Ongoing',
        startDate: new Date('2024-06-15T11:59:59.999Z'),
        endDate: new Date('2024-06-15T12:00:00.001Z'),
      });

      // With 2ms total duration and 1ms elapsed, progress should be 50%
      expect(component.progress()).toBe(50);
    });

    it('should ensure progress is always between 0 and 100', () => {
      setInputs({
        status: 'Ongoing',
        startDate: new Date('2024-06-10T12:00:00Z'),
        endDate: new Date('2024-06-20T12:00:00Z'),
      });

      const progress = component.progress();
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });
  });

  describe('Component Integration', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should render without errors', () => {
      setInputs({
        status: 'Ongoing',
        startDate: new Date('2024-06-10T12:00:00Z'),
        endDate: new Date('2024-06-20T12:00:00Z'),
      });

      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle component lifecycle correctly', () => {
      setInputs({
        status: 'Ongoing',
        startDate: new Date('2024-06-10T12:00:00Z'),
        endDate: new Date('2024-06-20T12:00:00Z'),
      });

      // Component should render without errors
      expect(() => fixture.detectChanges()).not.toThrow();

      // Progress should be calculated correctly
      const progress = component.progress();
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });
  });
});
