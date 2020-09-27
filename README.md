# postgraphile-table-extension-plugin
 
[![Maintainability](https://api.codeclimate.com/v1/badges/807ee680e7e7ecbfef6a/maintainability)](https://codeclimate.com/github/hansololai/postgraphile-table-extension-plugin/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/807ee680e7e7ecbfef6a/test_coverage)](https://codeclimate.com/github/hansololai/postgraphile-table-extension-plugin/test_coverage)
[![CircleCI](https://circleci.com/gh/hansololai/postgraphile-table-extension-plugin.svg?style=shield)](https://github.com/hansololai/postgraphile-table-extension-plugin)

## Motivation
Sometimes we create want to add some table/view's (call table A) to another table (table B), so that when we query for table B, we could also get the fields in table A without go into the association

Example
```graphql
type User {
  id
  portfolioByPortfolioId {
    id
    name
  }
}
```
With this extension, it is possible to do the following
```graphql
query {
  allUsers{
    id
    name
  }
}
```
instead of 
```graphql
query{
  allUsers{
    id
    portfolioByPortfolioId {
      id
      name
    }
  } 
}
```
## Description
Currently, to extend a table `A` to `B` (adding fields from `A` to `B`), it must satisfy the following

  1. table A and table B must be associated with a foreign key. 
     a. if A has a foreign key like `b_id`. Then this would be a `forwardExtension`.
     b. if B has a foregin key like `a_id`. then adding fields from `A` to `B` would be a `backwardExtension`.
  2. the foreignKey between `A` and `B` should be an unique foreign key. 
  3. The fields that gets copied cannot overlap. 
## How to Use ##
```
npm install postgraphile-table-extension-plugin
```
Then add it to postgraphile
```js
import {tableExtensionPlugin} from 'postgraphile-table-extension-plugin';

createPostGraphileSchema(client, ['p'], {
appendPlugins:[tableExtensionPlugin]
});
```
Then use `@smartComment` on the foreignKey to indication extension
For example, if you want to add `table A`'s fields to `table B`, then 
```sql
comment on table_a.b_id is E'@forwardExtension';
```
or if the foreign key is on `table B`, then
```sql
comment on table_b.a_id is E'@backwardExtension';
```
