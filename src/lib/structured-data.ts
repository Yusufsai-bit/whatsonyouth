// Helpers to build schema.org JSON-LD objects for What's On Youth pages.

const BASE_URL = 'https://www.whatsonyouth.org.au';
const SITE_NAME = "What's On Youth";

export const ORGANIZATION_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: BASE_URL,
  logo: `${BASE_URL}/woy-favicon.svg`,
  description:
    "Free platform helping young Victorians aged 15–25 find events, jobs, grants, programs and wellbeing support across Victoria.",
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Victoria, Australia',
  },
} as const;

export const WEBSITE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: BASE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${BASE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
} as const;

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface ListingForJsonLd {
  id: string;
  title: string;
  organisation: string;
  location: string;
  description: string;
  link: string;
  image_url: string | null;
  created_at: string;
  expiry_date: string | null;
  category: string;
}

const baseOrg = (name: string) => ({
  '@type': 'Organization',
  name,
});

const basePlace = (location: string) => ({
  '@type': 'Place',
  name: location,
  address: {
    '@type': 'PostalAddress',
    addressRegion: 'Victoria',
    addressCountry: 'AU',
    addressLocality: location,
  },
});

/**
 * Build category-appropriate JSON-LD for a listing.
 * Events → Event, Jobs → JobPosting, Grants → Grant (MonetaryGrant),
 * Programs → Course, Wellbeing → GovernmentService / Service.
 */
export function buildListingJsonLd(listing: ListingForJsonLd) {
  const url = `${BASE_URL}/listings/${listing.id}`;
  const description = listing.description.replace(/^\[Link needs review\]\s*/i, '').trim();
  const image = listing.image_url || undefined;

  // Used to mark Events / Offers as expired when the deadline has passed,
  // so we don't claim availability we can't deliver on.
  const isExpired =
    !!listing.expiry_date && new Date(listing.expiry_date).getTime() < Date.now();

  const youthAudience = {
    '@type': 'PeopleAudience',
    suggestedMinAge: 15,
    suggestedMaxAge: 25,
  };

  switch (listing.category) {
    case 'Events':
      return {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: listing.title,
        description,
        url,
        // expiry_date for events is the event date itself.
        ...(listing.expiry_date && { startDate: listing.expiry_date, endDate: listing.expiry_date }),
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode:
          listing.location.toLowerCase() === 'online'
            ? 'https://schema.org/OnlineEventAttendanceMode'
            : 'https://schema.org/OfflineEventAttendanceMode',
        location: basePlace(listing.location),
        organizer: baseOrg(listing.organisation),
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'AUD',
          availability: isExpired
            ? 'https://schema.org/SoldOut'
            : 'https://schema.org/InStock',
          url: listing.link,
          ...(listing.expiry_date && { validThrough: listing.expiry_date }),
        },
        audience: youthAudience,
        ...(image && { image }),
        inLanguage: 'en-AU',
      };

    case 'Jobs':
      // Note: we deliberately omit `employmentType` and `directApply` because
      // the source data doesn't reliably specify either. Google's JobPosting
      // spec treats both as optional — guessing them risks misclassification.
      return {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: listing.title,
        description,
        url,
        datePosted: listing.created_at,
        ...(listing.expiry_date && { validThrough: listing.expiry_date }),
        hiringOrganization: baseOrg(listing.organisation),
        jobLocation: basePlace(listing.location),
        applicantLocationRequirements: {
          '@type': 'Country',
          name: 'AU',
        },
        ...(image && { image }),
      };

    case 'Grants':
      return {
        '@context': 'https://schema.org',
        '@type': 'MonetaryGrant',
        name: listing.title,
        description,
        url,
        ...(listing.expiry_date && { validThrough: listing.expiry_date }),
        funder: baseOrg(listing.organisation),
        areaServed: {
          '@type': 'AdministrativeArea',
          name: listing.location,
        },
        ...(image && { image }),
      };

    case 'Programs':
      return {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: listing.title,
        description,
        url,
        provider: baseOrg(listing.organisation),
        ...(listing.expiry_date && { endDate: listing.expiry_date }),
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'AUD',
          category: 'Free',
          url: listing.link,
        },
        inLanguage: 'en-AU',
        // Use schema.org-recognised audience instead of free-form educationalLevel.
        audience: youthAudience,
        ...(image && { image }),
      };

    case 'Wellbeing':
      return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: listing.title,
        description,
        url,
        serviceType: 'Mental health and wellbeing support',
        provider: baseOrg(listing.organisation),
        areaServed: {
          '@type': 'AdministrativeArea',
          name: listing.location,
        },
        audience: youthAudience,
        ...(image && { image }),
      };

    default:
      return {
        '@context': 'https://schema.org',
        '@type': 'Thing',
        name: listing.title,
        description,
        url,
      };
  }
}

export function buildCollectionPageJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  numberOfItems: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: BASE_URL },
    about: ORGANIZATION_JSONLD,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: opts.numberOfItems,
    },
  };
}
