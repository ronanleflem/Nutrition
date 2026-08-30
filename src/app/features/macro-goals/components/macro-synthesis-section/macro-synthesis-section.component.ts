import { Component, inject, OnInit, signal } from '@angular/core';

import {
  formatIsoDateLabel,
  shiftIsoDate,
  todayIsoDate,
  type DailyMacroSynthesis,
} from '../../../../core/models/daily-macro-synthesis';
import { DailyMacroSynthesisService } from '../../../../core/scoring/daily-macro-synthesis.service';
import { MacroBarGroupComponent } from '../macro-bar-group/macro-bar-group.component';
import { MacroSynthesisSheetComponent } from '../macro-synthesis-sheet/macro-synthesis-sheet.component';

@Component({
  selector: 'app-macro-synthesis-section',
  imports: [MacroBarGroupComponent, MacroSynthesisSheetComponent],
  templateUrl: './macro-synthesis-section.component.html',
  styleUrl: './macro-synthesis-section.component.scss',
})
export class MacroSynthesisSectionComponent implements OnInit {
  private readonly synthesisService = inject(DailyMacroSynthesisService);

  readonly selectedDate = signal(todayIsoDate());
  readonly synthesis = signal<DailyMacroSynthesis | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly sheetOpen = signal(false);

  ngOnInit(): void {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const result = await this.synthesisService.getDailySynthesis(this.selectedDate());
      this.synthesis.set(result);
    } catch {
      this.loadError.set('Impossible de charger la synthèse du jour.');
      this.synthesis.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  dateLabel(): string {
    return formatIsoDateLabel(this.selectedDate());
  }

  previousDay(): void {
    this.selectedDate.update((date) => shiftIsoDate(date, -1));
    void this.reload();
  }

  nextDay(): void {
    this.selectedDate.update((date) => shiftIsoDate(date, 1));
    void this.reload();
  }

  goToToday(): void {
    this.selectedDate.set(todayIsoDate());
    void this.reload();
  }

  openMealSheet(): void {
    this.sheetOpen.set(true);
  }

  closeMealSheet(): void {
    this.sheetOpen.set(false);
  }
}
