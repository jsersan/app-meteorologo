import { ComunidadAutonoma } from '../models/weather.models';

export const TODA_ESPANA: ComunidadAutonoma = {
  id: '00', code: 'ESP', name: '🇪🇸 Toda España',
  municipios: [
    { id: '28079', name: 'Madrid',                    lat: 40.416, lon: -3.703 },
    { id: '41091', name: 'Sevilla',                   lat: 37.389, lon: -5.984 },
    { id: '08019', name: 'Barcelona',                 lat: 41.386, lon:  2.170 },
    { id: '46250', name: 'Valencia',                  lat: 39.470, lon: -0.376 },
    { id: '48020', name: 'Bilbao',                    lat: 43.263, lon: -2.934 },
    { id: '15078', name: 'Santiago de Compostela',    lat: 42.877, lon: -8.544 },
    { id: '35016', name: 'Las Palmas de Gran Canaria',lat: 28.124, lon:-15.436 },
    { id: '07040', name: 'Palma',                     lat: 39.570, lon:  2.650 },
  ],
};

export const SPAIN_DATA: ComunidadAutonoma[] = [
  {
    id: '01', code: 'AND', name: 'Andalucía',
    municipios: [
      { id: '41091', name: 'Sevilla',   lat: 37.389, lon: -5.984 },
      { id: '18087', name: 'Granada',   lat: 37.177, lon: -3.598 },
      { id: '29067', name: 'Málaga',    lat: 36.721, lon: -4.421 },
      { id: '14021', name: 'Córdoba',   lat: 37.888, lon: -4.779 },
      { id: '04013', name: 'Almería',   lat: 36.834, lon: -2.463 },
      { id: '11012', name: 'Cádiz',     lat: 36.527, lon: -6.292 },
      { id: '21041', name: 'Huelva',    lat: 37.261, lon: -6.945 },
      { id: '23050', name: 'Jaén',      lat: 37.779, lon: -3.787 },
    ]
  },
  {
    id: '02', code: 'ARA', name: 'Aragón',
    municipios: [
      { id: '50297', name: 'Zaragoza', lat: 41.649, lon: -0.887 },
      { id: '22125', name: 'Huesca',   lat: 42.136, lon: -0.408 },
      { id: '44216', name: 'Teruel',   lat: 40.343, lon: -1.107 },
    ]
  },
  {
    id: '03', code: 'AST', name: 'Principado de Asturias',
    municipios: [
      { id: '33044', name: 'Oviedo', lat: 43.362, lon: -5.849 },
      { id: '33024', name: 'Gijón',  lat: 43.535, lon: -5.661 },
      { id: '33004', name: 'Avilés', lat: 43.555, lon: -5.925 },
    ]
  },
  {
    id: '04', code: 'BAL', name: 'Illes Balears',
    municipios: [
      // Capitals de cada illa
      { id: '07040', name: 'Palma (Mallorca)',   lat: 39.570, lon:  2.650 },
      { id: '07033', name: 'Maó (Menorca)',      lat: 39.888, lon:  4.265 },
      { id: '07026', name: 'Eivissa (Ibiza)',    lat: 38.909, lon:  1.433 },
      { id: '07024', name: 'Formentera',         lat: 38.702, lon:  1.467 },
    ]
  },
  {
    id: '05', code: 'CAN', name: 'Canarias',
    municipios: [
      // Capital de cada isla
      { id: '35016', name: 'Las Palmas (Gran Canaria)',  lat: 28.124, lon:-15.436 },
      { id: '38038', name: 'Santa Cruz (Tenerife)',      lat: 28.468, lon:-16.252 },
      { id: '35003', name: 'Arrecife (Lanzarote)',       lat: 28.963, lon:-13.548 },
      { id: '35012', name: 'Puerto del Rosario (Fuerteventura)', lat: 28.499, lon:-13.863 },
      { id: '38001', name: 'Valverde (El Hierro)',       lat: 27.808, lon:-17.913 },
      { id: '38023', name: 'San Sebastián (La Gomera)',  lat: 28.092, lon:-17.113 },
      { id: '38040', name: 'Santa Cruz (La Palma)',      lat: 28.683, lon:-17.764 },
    ]
  },
  {
    id: '06', code: 'CBR', name: 'Cantabria',
    municipios: [
      { id: '39075', name: 'Santander', lat: 43.462, lon: -3.810 },
    ]
  },
  {
    id: '07', code: 'CLM', name: 'Castilla-La Mancha',
    municipios: [
      { id: '45168', name: 'Toledo',       lat: 39.857, lon: -4.024 },
      { id: '02003', name: 'Albacete',     lat: 38.994, lon: -1.857 },
      { id: '13034', name: 'Ciudad Real',  lat: 38.985, lon: -3.930 },
      { id: '16078', name: 'Cuenca',       lat: 40.066, lon: -2.131 },
      { id: '19130', name: 'Guadalajara',  lat: 40.633, lon: -3.167 },
    ]
  },
  {
    id: '08', code: 'CYL', name: 'Castilla y León',
    municipios: [
      { id: '05019', name: 'Ávila',       lat: 40.657, lon: -4.700 },
      { id: '09059', name: 'Burgos',      lat: 42.344, lon: -3.697 },
      { id: '24089', name: 'León',        lat: 42.599, lon: -5.571 },
      { id: '34120', name: 'Palencia',    lat: 42.010, lon: -4.533 },
      { id: '37274', name: 'Salamanca',   lat: 40.966, lon: -5.664 },
      { id: '40194', name: 'Segovia',     lat: 40.948, lon: -4.119 },
      { id: '42173', name: 'Soria',       lat: 41.764, lon: -2.465 },
      { id: '47186', name: 'Valladolid',  lat: 41.653, lon: -4.724 },
      { id: '49275', name: 'Zamora',      lat: 41.503, lon: -5.745 },
    ]
  },
  {
    id: '09', code: 'CAT', name: 'Cataluña',
    municipios: [
      { id: '08019', name: 'Barcelona', lat: 41.386, lon:  2.170 },
      { id: '17079', name: 'Girona',    lat: 41.983, lon:  2.824 },
      { id: '25120', name: 'Lleida',    lat: 41.614, lon:  0.625 },
      { id: '43148', name: 'Tarragona', lat: 41.119, lon:  1.244 },
    ]
  },
  {
    id: '10', code: 'EXT', name: 'Extremadura',
    municipios: [
      { id: '06015', name: 'Badajoz', lat: 38.880, lon: -6.974 },
      { id: '10037', name: 'Cáceres', lat: 39.476, lon: -6.372 },
    ]
  },
  {
    id: '11', code: 'GAL', name: 'Galicia',
    municipios: [
      { id: '15030', name: 'A Coruña',               lat: 43.371, lon: -8.396 },
      { id: '27028', name: 'Lugo',                   lat: 43.012, lon: -7.556 },
      { id: '32054', name: 'Ourense',                lat: 42.336, lon: -7.864 },
      { id: '36038', name: 'Pontevedra',             lat: 42.433, lon: -8.647 },
      { id: '15078', name: 'Santiago de Compostela', lat: 42.877, lon: -8.544 },
    ]
  },
  {
    id: '13', code: 'MAD', name: 'Comunidad de Madrid',
    municipios: [
      { id: '28079', name: 'Madrid', lat: 40.416, lon: -3.703 },
    ]
  },
  {
    id: '14', code: 'MUR', name: 'Región de Murcia',
    municipios: [
      { id: '30030', name: 'Murcia',    lat: 37.984, lon: -1.128 },
      { id: '30016', name: 'Cartagena', lat: 37.605, lon: -0.986 },
    ]
  },
  {
    id: '15', code: 'NAV', name: 'Comunidad Foral de Navarra',
    municipios: [
      { id: '31201', name: 'Pamplona/Iruña', lat: 42.816, lon: -1.643 },
    ]
  },
  {
    id: '16', code: 'PV', name: 'País Vasco',
    municipios: [
      { id: '01059', name: 'Vitoria-Gasteiz',       lat: 42.849, lon: -2.674 },
      { id: '48020', name: 'Bilbao',                lat: 43.263, lon: -2.934 },
      { id: '20069', name: 'Donostia-San Sebastián',lat: 43.318, lon: -1.981 },
    ]
  },
  {
    id: '17', code: 'RIO', name: 'La Rioja',
    municipios: [
      { id: '26089', name: 'Logroño', lat: 42.466, lon: -2.445 },
    ]
  },
  {
    id: '18', code: 'VAL', name: 'Comunitat Valenciana',
    municipios: [
      { id: '03014', name: 'Alicante/Alacant',    lat: 38.345, lon: -0.481 },
      { id: '12040', name: 'Castellón de la Plana',lat: 39.987, lon: -0.038 },
      { id: '46250', name: 'Valencia',             lat: 39.470, lon: -0.376 },
    ]
  },
  {
    id: '19', code: 'CEU', name: 'Ceuta',
    municipios: [
      { id: '51001', name: 'Ceuta', lat: 35.889, lon: -5.321 },
    ]
  },
  {
    id: '20', code: 'MEL', name: 'Melilla',
    municipios: [
      { id: '52001', name: 'Melilla', lat: 35.293, lon: -2.938 },
    ]
  },
];

export const CCAA_INE_MAP: Record<string, string> = {
  'Andalucía':'01','Aragón':'02','Principado de Asturias':'03',
  'Illes Balears':'04','Canarias':'05','Cantabria':'06',
  'Castilla-La Mancha':'07','Castilla y León':'08','Cataluña':'09',
  'Extremadura':'10','Galicia':'11','Comunidad de Madrid':'13',
  'Región de Murcia':'14','Comunidad Foral de Navarra':'15',
  'País Vasco':'16','La Rioja':'17','Comunitat Valenciana':'18',
  'Ceuta':'19','Melilla':'20',
};
