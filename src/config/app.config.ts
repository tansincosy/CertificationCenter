import { readFileSync } from 'fs';
import * as yaml from 'yaml';
import { join } from 'path';

const YAML_CONFIG_FILENAME = 'resources/application.yaml';

let CacheConfig = null;
export default () => {
  if (!CacheConfig) {
    CacheConfig = yaml.parse(
      readFileSync(join(YAML_CONFIG_FILENAME), 'utf8'),
    ) as Record<string, any>;
  }
  return CacheConfig;
};
