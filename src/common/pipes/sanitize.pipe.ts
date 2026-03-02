import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class SanitizePipe implements PipeTransform {
  private sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // strip scripts
        .replace(/javascript:/gi, '')           // strip js: protocol
        .replace(/on\w+\s*=/gi, '')             // strip event handlers
        .replace(/\$where/g, '')                // mongo injection
        .replace(/\$eq|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$or|\$and/g, '') // mongo operators
        .trim();
    }
    if (Array.isArray(value)) return value.map((v) => this.sanitizeValue(v));
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, this.sanitizeValue(v)])
      );
    }
    return value;
  }

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'body') return this.sanitizeValue(value);
    return value;
  }
}