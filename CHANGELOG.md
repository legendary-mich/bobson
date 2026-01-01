# Changelog

### 2.0.0
#### breaking changes:
- `add_base_type` expects 4 arguments now
- Names of object fields with a `?` prefix are not accepted
- Default values are accepted in a form of a string only
- Default values for `objects` and `arrays` are forbidden
- Default values are validated

#### non-breaking changes:
- Allow for nullification of inherited object fields
- Remove the min length constraint from `enums`

### 1.0.0
- Add a parser
- Add a serializer
- Add a parser for flat pairs
