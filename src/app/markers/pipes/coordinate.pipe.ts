import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'coordinate' })
export class CoordinatePipe implements PipeTransform {
  transform(value: number, digits = 5): string {
    return value.toFixed(digits);
  }
}
