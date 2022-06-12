import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { toObject } from './util/help.util';

@Injectable()
export class AppService {
  getVersion() {
    const packageJsonData = toObject<any>(readFileSync('package.json', 'utf8'));
    return {
      version: packageJsonData.version,
      name: packageJsonData.name,
    };
  }
}
