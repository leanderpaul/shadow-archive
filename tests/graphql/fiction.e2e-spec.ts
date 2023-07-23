/**
 * Importing npm packages
 */
import { faker } from '@faker-js/faker';

/**
 * Importing user defined packages
 */
import { GraphQLModule, ShadowArchive } from '@tests/utils';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */
const archive = new ShadowArchive(GraphQLModule.FICTION);
const seeder = archive.getSeeder();

seeder.addUser('user-1', { email: 'fiction-tester-one@shadow-apps.com', name: 'Expense Tester One' });

beforeAll(() => archive.setup(), archive.getTimeout());

describe('[GraphQL][chronicle]', function () {
  describe('create new fiction', function () {
    const query = /* GraphQL */ `
      mutation CreateFiction($fiction: FictionInput!) {
        createFiction(input: $fiction) {
          fid
          name
          type
          genres
          tags
          authors
          desc
        }
      }
    `;
    const variables = {
      fiction: {
        name: 'Fiction title',
        type: 'WEBNOVEL',
        tier: 'FREE',
        genres: ['ACTION'],
        tags: ['World Travel', 'System'],
        authors: ['Author 1', 'Author 2'],
        desc: 'Fiction description is provided here',
        status: 'ONGOING',
      },
    };

    it('returns the newly created fiction', async () => {
      const response = await archive.graphql(query, variables).session('user-1');
      response.expectGraphQLData({
        createFiction: {
          fid: expect.toBeID(),
          name: variables.fiction.name,
          type: variables.fiction.type,
          genres: expect.toBeArrayIncludingOnly(variables.fiction.genres),
          tags: expect.toBeArrayIncludingOnly(variables.fiction.tags),
          authors: expect.toBeArrayIncludingOnly(variables.fiction.authors),
          desc: variables.fiction.desc,
        },
      });
      archive.storeData('fiction', response.getGraphQLData('createFiction'));
    });
  });

  describe('Create fiction chapter', function () {
    const query = /* GraphQL */ `
      mutation AddChapter($fid: ID!, $chapter: FictionChapterInput!) {
        addFictionChapter(fid: $fid, input: $chapter) {
          index
          name
          content
          matureContent
          createdAt
        }
      }
    `;

    const variables = { chapter: { name: 'Chapter 1', content: faker.lorem.lines({ min: 10, max: 20 }) } };

    it('returns the newly created fiction chapter', async () => {
      const fiction = archive.getStoredData('fiction');
      const response = await archive.graphql(query, { fid: fiction.fid, ...variables }).session('user-1');
      response.expectGraphQLData({
        addFictionChapter: {
          index: 1,
          name: variables.chapter.name,
          content: variables.chapter.content.replaceAll('\n', '<br />'),
          matureContent: null,
          createdAt: expect.toBeDateString(),
        },
      });
    });
  });

  describe('Search fictions', function () {
    const query = /* GraphQL */ `
      query SearchFictions {
        fictions {
          totalCount
          page {
            hasPrev
            hasNext
          }
          items {
            fid
            name
            type
            authors
            genres
            desc
            chapterCount
          }
        }
      }
    `;

    it('returns the fiction list', async () => {
      const fiction = archive.getStoredData('fiction');
      const response = await archive.graphql(query).session('user-1');
      response.expectGraphQLData({
        fictions: {
          totalCount: 1,
          page: { hasPrev: false, hasNext: false },
          items: expect.toBeArrayIncludingOnly([
            expect.objectContaining({
              fid: fiction.fid,
              name: fiction.name,
              type: fiction.type,
              genres: expect.toBeArrayIncludingOnly(fiction.genres),
              authors: expect.toBeArrayIncludingOnly(fiction.authors),
              desc: fiction.desc,
              chapterCount: 1,
            }),
          ]),
        },
      });
    });
  });

  describe('Get the fiction details', function () {
    const query = /* GraphQL */ `
      query GetFiction($fid: ID!) {
        fiction(fid: $fid) {
          fid
          name
          type
          genres
          tags
          authors
          desc
          views
          chapterCount
          chapters {
            index
            name
          }
          volumes {
            name
            chapterCount
          }
          createdAt
          updatedAt
        }
      }
    `;

    it('returns the fiction', async () => {
      const fiction = archive.getStoredData('fiction');
      const response = await archive.graphql(query, { fid: fiction.fid }).session('user-1');
      response.expectGraphQLData({
        fiction: {
          fid: fiction.fid,
          name: fiction.name,
          type: fiction.type,
          genres: expect.toBeArrayIncludingOnly(fiction.genres),
          tags: expect.toBeArrayIncludingOnly(fiction.tags),
          authors: expect.toBeArrayIncludingOnly(fiction.authors),
          desc: fiction.desc,
          views: expect.toBeNumber(),
          chapterCount: 1,
          chapters: expect.toBeArrayIncludingOnly([expect.objectContaining({ index: 1, name: 'Chapter 1' })]),
          volumes: null,
          createdAt: expect.toBeDateString(),
          updatedAt: expect.toBeDateString(),
        },
      });
    });
  });
});

afterAll(() => archive.teardown(), archive.getTimeout());
