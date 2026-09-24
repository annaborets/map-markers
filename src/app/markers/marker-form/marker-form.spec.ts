import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store, provideStore } from '@ngxs/store';
import { beforeEach, describe, expect, it } from 'vitest';
import { SelectMarker, SetDraftPosition } from '../state/markers.actions';
import { MarkersSelectors } from '../state/markers.selectors';
import { MarkersState } from '../state/markers.state';
import { MarkerForm } from './marker-form';

describe('MarkerForm', () => {
  let store: Store;
  let fixture: ComponentFixture<MarkerForm>;

  const el = () => fixture.nativeElement as HTMLElement;
  const input = (label: string) =>
    Array.from(el().querySelectorAll('mat-form-field')).find(f => f.textContent?.includes(label))!
      .querySelector('input')!;
  const button = (text: string) =>
    Array.from(el().querySelectorAll('button')).find(b => b.textContent?.includes(text))!;
  const saved = (id: string) => store.selectSnapshot(MarkersSelectors.markers).find(m => m.id === id)!;

  const type = async (label: string, value: string) => {
    const field = input(label);
    field.value = value;
    field.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  const run = async (action: object) => {
    await store.dispatch(action);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideStore([MarkersState])] });
    store = TestBed.inject(Store);
    fixture = TestBed.createComponent(MarkerForm);
    await fixture.whenStable();
    await run(new SelectMarker('lavra'));
  });

  it('disables Save until something differs from the saved marker', async () => {
    expect(button('Save').disabled).toBe(true);
    await type('Name', 'Lavra');
    expect(button('Save').disabled).toBe(false);
    await type('Name', 'Kyiv-Pechersk Lavra');
    expect(button('Save').disabled).toBe(true);
  });

  it('shows a drag as an unsaved change and commits it on Save', async () => {
    await run(new SetDraftPosition({ lon: 31, lat: 51 }));
    expect(input('Longitude').valueAsNumber).toBe(31);
    expect(saved('lavra').lon).toBe(30.5576);
    expect(button('Save').disabled).toBe(false);

    button('Save').click();
    await fixture.whenStable();
    expect(saved('lavra')).toMatchObject({ lon: 31, lat: 51 });
    expect(store.selectSnapshot(MarkersSelectors.draftPosition)).toBeNull();
    expect(button('Save').disabled).toBe(true);
  });

  it('keeps a typed name when the marker is dragged', async () => {
    await type('Name', 'Draft name');
    await run(new SetDraftPosition({ lon: 31, lat: 51 }));
    expect(input('Name').value).toBe('Draft name');
    expect(input('Latitude').valueAsNumber).toBe(51);
  });

  it('discards the drag on Cancel', async () => {
    await run(new SetDraftPosition({ lon: 31, lat: 51 }));
    button('Cancel').click();
    await fixture.whenStable();
    expect(store.selectSnapshot(MarkersSelectors.draftPosition)).toBeNull();
    expect(saved('lavra').lon).toBe(30.5576);
  });
});
