import { Plugin, Context } from 'postgraphile-core';
import { PgClass, QueryBuilder, PgConstraint } from 'graphile-build-pg';
import { IGraphQLToolsResolveInfo } from 'graphql-tools';
import { GraphileBuild } from './postgraphile_types';

/**
 * @description Check if a foreign key constraint is unique
 * @param fk
 */
export const isFkConstraintUnique = (fk:PgConstraint) => {
  const curKeys = fk.keyAttributes;
  const isUnique = fk.foreignClass && !!fk.class.constraints.find((fc) => (
    ['p', 'u'].includes(fc.type)
    && fc.keyAttributes.length === curKeys.length
    && fc.keyAttributes.every((k) => curKeys.find((ck) => ck.name === k.name))
  ));
  return isUnique;
};
const isSingleKeyUniqueFkConstraint = (
  fk:PgConstraint,
) => isFkConstraintUnique(fk) && fk.foreignClass
  && fk.foreignKeyAttributes.length === 1 && fk.keyAttributes.length === 1;

const extendRelationWithAnother = (fk: PgConstraint, forward:boolean,
  build: GraphileBuild, context: Context<any>) => {
  if (!fk.foreignClass) return {};
  const {
    pgSql: sql,
    graphql: { GraphQLString },
    inflection,
    getSafeAliasFromResolveInfo,
    getSafeAliasFromAlias,
    pgGetGqlTypeByTypeIdAndModifier,
    // pgQueryFromResolveData: queryFromResolveData,
  } = build as GraphileBuild;
  const {
    fieldWithHooks,
  } = context;

  const innerTable = forward ? fk.foreignClass : fk.class;
  const mainTable = forward ? fk.class : fk.foreignClass;
  const anotherTableKeyAttribute = forward ? fk.foreignKeyAttributes[0] : fk.keyAttributes[0];
  const thisTableKeyAttribute = forward ? fk.keyAttributes[0] : fk.foreignKeyAttributes[0];
  const innerTableFields = innerTable.attributes.reduce((acc, cur) => {
    if (cur.name === anotherTableKeyAttribute.name) {
      return acc;
    }
    const fieldName = inflection.camelCase(cur.name);
    // We don't want to override existing attributes, so if it already have one, skipt it
    if (mainTable.attributes.find((a) => (a.name === cur.name))) {
      return acc;
    }

    return {
      ...acc,
      [fieldName]: fieldWithHooks(
        fieldName,
        (fieldContext:any) => {
          const {
            addDataGenerator,
          } = fieldContext;
          const ReturnType = pgGetGqlTypeByTypeIdAndModifier(
            cur.typeId,
            cur.typeModifier,
          ) || GraphQLString;
          addDataGenerator((parsedResolveInfoFragment: any) => ({
              pgQuery: (queryBuilder: QueryBuilder) => {
                queryBuilder.select(() => sql.fragment`(
                    select ${sql.identifier(cur.name)} from ${sql.identifier(
                      innerTable.namespace.name,
                      innerTable.name,
                    )} where ${sql.identifier(innerTable.namespace.name,
                      innerTable.name)}.${sql.identifier(anotherTableKeyAttribute.name)}
                      = ${queryBuilder.getTableAlias()}.${sql.identifier(thisTableKeyAttribute.name)}
                  )`, getSafeAliasFromAlias(parsedResolveInfoFragment.alias));
              },
            }));
            return {
              description: `Reads through a \`${innerTable.name}\`.'${anotherTableKeyAttribute.name}'`,
              // type: new GraphQLNonNull(RightTableType),
              // This maybe should be nullable? because polymorphic foreign key
              // is not constraint
              type: ReturnType,
              args: {},
              resolve: (
                data: any, _args: any, _context: any,
                resolveInfo: IGraphQLToolsResolveInfo,
              ) => {
                const safeAlias = getSafeAliasFromResolveInfo(resolveInfo);
                return data[safeAlias];
              },
            };
        },
        { isPgRowExtensionField: true },
      ),
    };
  }, {});
  return innerTableFields;
};

/**
 * @description Add extension of table to table extension view
 * This plugin works on two relations (table, view or mat views) that are associated with one-to-one
 * If the foreign key for table(view) A point to table(view) B, and the foreign key is UNIQUE, then we
 * can merge put all tables from one table to another table. This would help some situations where the
 * database tables represent a "database model", but they are slightly different from the "domain level" object
 * For example,  we have "locations" table, we also have a "location_infos" view that is one-to-one with location.
 * the view provide extra attributes of the location that is much faster to calculate in database instead of using js/ruby.
 * Suppose you want to add all fields in table B to tableA, and table B is associated to table A via a foreignKey column
 * in table B. Then you can use a smart tag @extensionOf "table A" on the column to indicate B is an extension of A.
 * You could also do the opposite by @extensionFrom to add all fields in tableA to table B. Note the "copy fields" will not copy
 * the foreign key and the primary key that linked the two tables. (because assume they are the same and you should not need them).
 * @param builder
 */
export const tableExtensionPlugin: Plugin = (builder) => {
  builder.hook('GraphQLObjectType:fields', (fields, build, context) => {
    const {
      extend,
      pgIntrospectionResultsByKind: {
        constraint,
      },
      pgColumnFilter,
    } = build as GraphileBuild;
    const {
      scope: { isPgRowType, isPgCompoundType, pgIntrospection: table },
    } = context;

    if (
      !pgColumnFilter
      || !(isPgRowType || isPgCompoundType)
      || !table
      || table.kind !== 'class'
    ) {
      return fields;
    }
    // For the table, we iterate all the foreign keys
    const foreignKeys = (table as PgClass).constraints.filter((c) => c.type === 'f');
    // only on location table
    // Forward extension, meaning we are going to add some foreign classes's attributes to this table
    // the foreign class is connected to this table by a foreignKey from this table.
    const forwardExtensionFields = foreignKeys.reduce((accFields, fk) => {
      // THe foreign key must be unique, right now let's force foreignKey is just single column
      if (!isSingleKeyUniqueFkConstraint(fk)) {
        return accFields;
      }
      // now we check the attribute smart tag
      const { backwardExtension } = fk.keyAttributes[0].tags;
      if (!backwardExtension) {
        return accFields;
      }
      const innerTableFields = extendRelationWithAnother(fk, true, build as GraphileBuild, context);
      return { ...accFields, ...innerTableFields };
    }, {});

    const backwardExtensionFields = constraint.reduce((acc, cur) => {
      // skip constraints that are not to this table
      if (cur.type !== 'f' || cur.foreignClassId !== table.id) {
        return acc;
      }
      const { forwardExtension } = cur.keyAttributes[0].tags;
      if (!forwardExtension) {
        return acc;
      }
      // skip it if it is not single key unique constraint
      if (!isSingleKeyUniqueFkConstraint(cur)) {
        return acc;
      }
      const innerTableFields = extendRelationWithAnother(cur, false,
        build as GraphileBuild, context);
      return { ...acc, ...innerTableFields };
    }, {});
    return extend(extend(fields, forwardExtensionFields), backwardExtensionFields);
  });
};
