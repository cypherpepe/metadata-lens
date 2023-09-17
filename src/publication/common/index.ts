import { z } from 'zod';

import {
  PublicationEncryptionStrategy,
  PublicationEncryptionStrategySchema,
} from './encryption.js';
import { MarketplaceMetadataSchema } from './marketplace.js';
import { MetadataAttribute, MetadataAttributeSchema } from '../../MetadataAttribute.js';
import {
  AppIdSchema,
  LocaleSchema,
  TagSchema,
  nonEmptyStringSchema,
  SignatureSchema,
  AppId,
  Locale,
  Tag,
} from '../../primitives.js';
import { PublicationMainFocus } from '../PublicationMainFocus.js';

export * from './encryption.js';
export * from './license.js';
export * from './marketplace.js';
export * from './media.js';
export * from './timezones.js';

export enum PublicationContentWarning {
  NSFW = 'NSFW',
  SENSITIVE = 'SENSITIVE',
  SPOILER = 'SPOILER',
}

/**
 * The operational metadata fields of a Lens publication.
 */
export type PublicationMetadataCore = {
  /**
   * A unique identifier that in storages like IPFS ensures the uniqueness of the metadata URI.
   *
   * Use a UUID if unsure.
   */
  id: string;
  /**
   * Determine if the publication should not be shown in any feed.
   *
   * @defaultValue false
   */
  hideFromFeed?: boolean;
  /**
   * Ability to only show when you filter on your App Id.
   *
   * This is useful for apps that want to show only their content on their apps.
   *
   * @defaultValue false
   */
  globalReach?: boolean;
  /**
   * The App Id that this publication belongs to.
   */
  appId?: AppId;
};
/**
 * @internal
 */
export const PublicationMetadataCoreSchema = z.object(
  {
    id: nonEmptyStringSchema(
      'A unique identifier that in storages like IPFS ensures the uniqueness of the metadata URI. Use a UUID if unsure.',
    ),

    hideFromFeed: z
      .boolean({
        description: 'Determine if the publication should not be shown in any feed.',
      })
      .optional(),

    globalReach: z
      .boolean({
        description:
          'Ability to only show when you filter on your App Id. ' +
          'This is useful for apps that want to show only their content on their apps.',
      })
      .optional(),

    appId: AppIdSchema.optional().describe('The App Id that this publication belongs to.'),
  },
  {
    description: 'The Lens operational metadata fields.',
  },
);

/**
 * Common fields of a Lens primary publication.
 */
export type PublicationMetadataCommon = PublicationMetadataCore & {
  /**
   * A bag of attributes that can be used to store any kind of metadata that is not currently supported by the standard.
   * Over time, common attributes will be added to the standard and their usage as arbitrary attributes will be discouraged.
   */
  attributes?: MetadataAttribute[];
  /**
   * The locale of the metadata.
   */
  locale?: Locale;
  /**
   * The encryption strategy used to encrypt the publication.
   *
   * If not present, the publication is presumed to be unencrypted.
   */
  encryptedWith?: PublicationEncryptionStrategy;
  /**
   * An arbitrary list of tags.
   */
  tags?: Tag[];
  /**
   * Specify a content warning.
   */
  contentWarning?: PublicationContentWarning;
};
const MetadataCommonSchema = PublicationMetadataCoreSchema.extend({
  attributes: MetadataAttributeSchema.array()
    .min(1)
    .max(20)
    .optional()
    .describe(
      'A bag of attributes that can be used to store any kind of metadata that is not currently supported by the standard. ' +
        'Over time, common attributes will be added to the standard and their usage as arbitrary attributes will be discouraged.',
    ),

  locale: LocaleSchema,

  encryptedWith: PublicationEncryptionStrategySchema.optional(),

  tags: TagSchema.array().max(10).optional().describe('An arbitrary list of tags.'),

  contentWarning: z
    .nativeEnum(PublicationContentWarning, { description: 'Specify a content warning.' })
    .optional(),
}).describe('The common Lens specific metadata details.');

/**
 * Ok, ok, don't! It's really not meant to be used outside.
 * Don't have Kenny say you we told you so.
 *
 * @internal
 */
export function metadataDetailsWith<
  Augmentation extends {
    mainContentFocus:
      | z.ZodLiteral<PublicationMainFocus>
      | z.ZodUnion<[z.ZodLiteral<PublicationMainFocus>, ...z.ZodLiteral<PublicationMainFocus>[]]>;
  },
>(augmentation: Augmentation) {
  return MetadataCommonSchema.extend(augmentation);
}

/**
 * Ok, ok, don't! It's really not meant to be used outside.
 * Don't have Kenny say you we told you so.
 *
 * @internal
 */
export function publicationWith<
  Augmentation extends {
    $schema: z.ZodLiteral<string>;
    lens: ReturnType<typeof metadataDetailsWith>;
  },
>(augmentation: Augmentation) {
  return MarketplaceMetadataSchema.extend({
    signature: SignatureSchema.optional(),
    ...augmentation,
  });
}

/**
 * Ok, ok, don't! It's really not meant to be used outside.
 * Don't have Kenny say you we told you so.
 *
 * @internal
 */
export function mainContentFocus<T extends PublicationMainFocus>(focus: T): z.ZodLiteral<T>;
export function mainContentFocus<T extends PublicationMainFocus, O extends PublicationMainFocus>(
  ...focuses: [T, O]
): z.ZodUnion<[z.ZodLiteral<T>, z.ZodLiteral<O>]>;
export function mainContentFocus(...focuses: [PublicationMainFocus, ...PublicationMainFocus[]]) {
  const description = 'The main focus of the publication.';
  if (focuses.length > 1) {
    const literals = focuses.map((value) => z.literal(value)) as [
      z.ZodLiteral<PublicationMainFocus>,
      z.ZodLiteral<PublicationMainFocus>,
      ...z.ZodLiteral<PublicationMainFocus>[],
    ];
    return z.union(literals, { description });
  }
  return z.literal(focuses[0], { description });
}
