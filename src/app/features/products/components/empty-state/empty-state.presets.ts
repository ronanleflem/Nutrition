import type { EmptyStatePreset, EmptyStateVariant } from './empty-state.types';

export const EMPTY_STATE_PRESETS: Record<EmptyStateVariant, EmptyStatePreset> = {
  products: {
    title: 'Votre catalogue est prêt',
    message:
      'Ajoutez vos produits du quotidien depuis la bibliothèque ou créez-les à la main.',
    ctaLabel: 'Explorer la bibliothèque',
    ctaLink: '/products/library',
    secondaryCtaLabel: 'Créer un produit',
    secondaryCtaLink: '/products/new',
  },
  recipes: {
    title: 'Ajoutez votre première recette',
    message: 'Construisez votre collection pour planifier vos repas en quelques taps.',
    ctaLabel: 'Créer une recette',
    ctaLink: '/recipes/new',
  },
  pantry: {
    title: 'Votre garde-manger vous attend',
    message: 'Notez ce que vous avez chez vous pour préparer vos courses sereinement.',
    ctaLabel: 'Ajouter un produit',
    ctaLink: '',
  },
  'meal-plan': {
    title: 'Rien de prévu cette semaine',
    message: 'Planifiez vos repas pour constituer votre liste de courses en un geste.',
    ctaLabel: 'Ouvrir le plan',
    ctaLink: '/plan',
  },
  'shopping-list': {
    title: 'Liste vide pour l’instant',
    message:
      'Votre garde-manger couvre peut-être tout le plan — générez la liste ou parcourez le plan.',
    ctaLabel: 'Voir le plan',
    ctaLink: '/plan',
  },
};
