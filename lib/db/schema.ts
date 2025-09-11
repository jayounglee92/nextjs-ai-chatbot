import type { InferSelectModel } from 'drizzle-orm'
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  integer,
} from 'drizzle-orm/pg-core'

export const user = pgTable('User', {
  id: varchar('id', { length: 255 }).primaryKey().notNull(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export type User = InferSelectModel<typeof user>

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: varchar('userId', { length: 255 })
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
})

export type Chat = InferSelectModel<typeof chat>

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
})

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>

export const message = pgTable('Message_v2', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  attachments: json('attachments').notNull(),
  createdAt: timestamp('createdAt').notNull(),
})

export type DBMessage = InferSelectModel<typeof message>

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    }
  },
)

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>

export const vote = pgTable(
  'Vote_v2',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    }
  },
)

export type Vote = InferSelectModel<typeof vote>

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: varchar('userId', { length: 255 })
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    }
  },
)

export type Document = InferSelectModel<typeof document>

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: varchar('userId', { length: 255 })
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
)

export type Suggestion = InferSelectModel<typeof suggestion>

export const stream = pgTable(
  'Stream',
  {
    id: uuid('id').notNull().defaultRandom(),
    chatId: uuid('chatId').notNull(),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  }),
)

export type Stream = InferSelectModel<typeof stream>

export const aiUseCase = pgTable('AiUseCase', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  thumbnailUrl: text('thumbnailUrl'),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
})

export type AiUseCase = InferSelectModel<typeof aiUseCase>

export const learningCenter = pgTable('LearningCenter', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  thumbnail: text('thumbnail').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  tags: text('tags').notNull(), // JSON string으로 저장
  videoId: text('videoId').notNull(),
})

export type LearningCenter = InferSelectModel<typeof learningCenter>

export const posts = pgTable('Posts', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  title: text('title').notNull(),
  summary: text('summary'), // NULL 허용
  summaryType: text('summaryType', {
    enum: ['ai_generated', 'auto_truncated'],
  })
    .notNull()
    .default('auto_truncated'),
  thumbnailUrl: text('thumbnailUrl'), // NULL 허용
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  postType: text('postType', {
    enum: ['aiusecase', 'learningcenter', 'news'],
  }).notNull(),
  visibility: text('visibility', {
    enum: ['public', 'private'],
  })
    .notNull()
    .default('private'),
  viewCount: integer('viewCount').notNull().default(0),
  likeCount: integer('likeCount').notNull().default(0),
  openType: text('openType', {
    enum: ['page', 'modal', 'new_tab'],
  }).default('page'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
})

export const postContents = pgTable('PostContents', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  postId: uuid('postId')
    .notNull()
    .references(() => posts.id),
  content: text('content').notNull(),
  category: text('category'), // NULL 허용
  tags: text('tags'), // NULL 허용
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
})

export type Posts = InferSelectModel<typeof posts>
export type PostContents = InferSelectModel<typeof postContents>
