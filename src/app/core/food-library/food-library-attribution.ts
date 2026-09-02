/** Attribution copy for embedded food-library sources (ODbL / Etalab). */

export const FOOD_LIBRARY_ATTRIBUTIONS = {
  ciqual: {
    label: 'Ciqual ANSES',
    url: 'https://ciqual.anses.fr/',
    license: 'Licence Ouverte Etalab 2.0',
    licenseUrl: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence',
  },
  opennutrition: {
    label: 'OpenNutrition',
    url: 'https://www.opennutrition.app/',
    license: 'Open Database License (ODbL) 1.0',
    licenseUrl: 'https://opendatacommons.org/licenses/odbl/',
  },
  openFoodFacts: {
    label: 'Open Food Facts',
    url: 'https://world.openfoodfacts.org/',
    note: 'Les données issues d\'Open Food Facts sont © Open Food Facts contributors.',
  },
} as const;

export const OPENNUTRITION_INLINE_CREDIT =
  'Données OpenNutrition sous licence ODbL — opennutrition.app';
