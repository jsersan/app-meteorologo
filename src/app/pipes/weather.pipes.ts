import { Pipe, PipeTransform } from '@angular/core';
import { WeatherIcon } from '../models/weather.models';

@Pipe({ name: 'weatherIcon', standalone: true })
export class WeatherIconPipe implements PipeTransform {
  transform(icon: WeatherIcon): string {
    const map: Record<WeatherIcon, string> = {
      sol:       '☀️',
      sol_nubes: '⛅',
      nubes:     '☁️',
      lluvia:    '🌧️',
      lluvia_sol:'🌦️',
      tormenta:  '⛈️',
      nieve:     '❄️',
      niebla:    '🌫️',
      viento:    '💨',
      granizo:   '🌨️',
    };
    return map[icon] ?? '🌡️';
  }
}

@Pipe({ name: 'weatherDesc', standalone: true })
export class WeatherDescPipe implements PipeTransform {
  transform(icon: WeatherIcon): string {
    const map: Record<WeatherIcon, string> = {
      sol:       'Despejado',
      sol_nubes: 'Parcialmente nublado',
      nubes:     'Nublado',
      lluvia:    'Lluvia',
      lluvia_sol:'Chubascos',
      tormenta:  'Tormenta',
      nieve:     'Nieve',
      niebla:    'Niebla',
      viento:    'Ventoso',
      granizo:   'Granizo',
    };
    return map[icon] ?? icon;
  }
}

@Pipe({ name: 'windDir', standalone: true })
export class WindDirPipe implements PipeTransform {
  transform(dir: string): string {
    const map: Record<string, string> = {
      N: '↓ N', NE: '↙ NE', E: '← E', SE: '↖ SE',
      S: '↑ S', SO: '↗ SO', O: '→ O', NO: '↘ NO',
      C: '— Calma'
    };
    return map[dir] ?? dir;
  }
}
