import { graphql } from 'graphql';
import { withPgClient } from '../helpers';
import { createPostGraphileSchema } from 'postgraphile';
import { readdirSync, readFile as rawReadFile } from 'fs';
import { resolve as resolvePath } from 'path';
import { printSchema } from 'graphql/utilities';
import {
  addFakeUniqueConstraintFromIndex,
  uniqueConstraintFromSmartComment,
} from '../../src';
// import debug from 'debug';

// const debug = debugger('graphile-build:schema');

function readFile(filename, encoding) {
  return new Promise((resolve, reject) => {
    rawReadFile(filename, encoding, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

const queriesDir = `${__dirname}/../fixtures/queries`;
const queryFileNames = readdirSync(queriesDir);
let queryResults: any[] = [];

const kitchenSinkData = () => readFile(`${__dirname}/../p-data.sql`, 'utf8');

beforeAll(() => {
  // Get a few GraphQL schema instance that we can query.
  const gqlSchemasPromise = withPgClient(async (pgClient) => {
    // Different fixtures need different schemas with different configurations.
    // Make all of the different schemas with different configurations that we
    // need and wait for them to be created in parallel.
    const [
      normal,
    ] = await Promise.all([
      createPostGraphileSchema(pgClient, ['p'], {
        appendPlugins: [
          addFakeUniqueConstraintFromIndex,
          uniqueConstraintFromSmartComment,
        ],
        graphileBuildOptions: {
          connectionFilterPolymorphicForward: true,
          connectionFilterRelations: true,
          connectionFilterAllowNullInput: true,
          connectionFilterAllowEmptyObjectInput: true,
        },
      }),
    ]);

    // debug(printSchema(normal));
    printSchema(normal);
    return {
      normal,
    };
  });

  // Execute all of the queries in parallel. We will not wait for them to
  // resolve or reject. The tests will do that.
  //
  // All of our queries share a single client instance.
  const queryResultsPromise = (async () => {
    // Wait for the schema to resolve. We need the schema to be introspected
    // before we can do anything else!
    const gqlSchemas = await gqlSchemasPromise;
    // Get a new Postgres client instance.
    return await withPgClient(async (pgClient) => {
      // Add data to the client instance we are using.

      await pgClient.query(await kitchenSinkData());
      // Run all of our queries in parallel.
      return await Promise.all(
        queryFileNames.map(async (fileName) => {
          // Read the query from the file system.
          const query = await readFile(
            resolvePath(queriesDir, fileName),
            'utf8',
          ) as string;
          const gqlSchema = gqlSchemas.normal;
          // Return the result of our GraphQL query.
          const result = await graphql(gqlSchema, query, null, {
            pgClient,
          });
          if (Array.isArray(result.errors) && result.errors.length > 0) {
            console.log(result.errors.map(e => e.originalError)); // eslint-disable-line no-console
            throw new Error(`Query failed! ${result.errors.map(e => e.message).join(',')}`);
          }
          return result;
        }),
      );
    });
  })();

  // Flatten out the query results promise.
  queryResults = queryFileNames.map(async (_, i) => {
    return await (await queryResultsPromise)[i] as any;
  });
});

for (let i = 0; i < queryFileNames.length; i += 1) {
  test(queryFileNames[i], async () => {
    expect(await queryResults[i]).toMatchSnapshot();
  });
}
