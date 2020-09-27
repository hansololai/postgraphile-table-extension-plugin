import { Build } from 'postgraphile';
import {
  PgAttribute,
  PgProc,
  PgClass,
  PgConstraint,
  PgExtension,
  PgType,
  PgNamespace,
  PgIndex,
} from 'graphile-build-pg';

export interface GraphilePgIntrospection {
  __pgVersion: number;
  attribute: PgAttribute[];
  attributeByClassIdAndNum: { [classId: string]: { [num: string]: PgAttribute } };
  class: PgClass[];
  classById: { [x: string]: PgClass };
  constraint: PgConstraint[];
  extension: PgExtension[];
  extensionById: { [x: string]: PgExtension };
  index: PgIndex[];
  namespace: PgNamespace[];
  namespaceById: { [x: string]: PgNamespace };
  procedure: PgProc[];
  type: PgType[];
  typeById: { [x: string]: PgType };
}
export interface GraphileBuild extends Build {
  pgIntrospectionResultsByKind: GraphilePgIntrospection;
}
