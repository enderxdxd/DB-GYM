// ================================
// src/lib/services/base.service.ts - VERSÃO CORRIGIDA PARA NEON
// ================================
import { sql } from '@/lib/database/neon';

export abstract class BaseService {
  protected async query<T = any>(
    queryText: string,
    params: any[] = []
  ): Promise<T[]> {
    console.log('🔵 [BASE_SERVICE] Executing query...');
    console.log('🔵 [BASE_SERVICE] Query:', queryText);
    console.log('🔵 [BASE_SERVICE] Params:', params);
    
    try {
      let result: any[];
      
      if (params.length === 0) {
        // Para queries sem parâmetros, usar sql.unsafe
        result = await sql.unsafe(queryText) as unknown as any[];
      } else {
        // Para queries com parâmetros, construir a query usando template literals
        // Substituir $1, $2, etc. pelos valores reais de forma segura
        const values = params.map(param => {
          if (param === null || param === undefined) {
            return 'NULL';
          }
          if (typeof param === 'string') {
            // Escapar aspas simples duplicando-as
            return `'${param.replace(/'/g, "''")}'`;
          }
          if (typeof param === 'number') {
            return param.toString();
          }
          if (typeof param === 'boolean') {
            return param ? 'TRUE' : 'FALSE';
          }
          if (param instanceof Date) {
            return `'${param.toISOString()}'`;
          }
          // Para outros tipos, converter para string e tratar como string
          return `'${String(param).replace(/'/g, "''")}'`;
        });

        // Substituir placeholders $1, $2, etc. pelos valores
        let interpolatedQuery = queryText;
        values.forEach((value, index) => {
          const placeholder = `${index + 1}`;
          interpolatedQuery = interpolatedQuery.replace(new RegExp(`\\${placeholder}\\b`, 'g'), value);
        });

        console.log('🔵 [BASE_SERVICE] Interpolated query:', interpolatedQuery);
        
        result = await sql.unsafe(interpolatedQuery) as unknown as any[];
      }
      
      console.log('✅ [BASE_SERVICE] Query executed successfully');
      console.log('✅ [BASE_SERVICE] Result count:', result?.length || 0);
      console.log('✅ [BASE_SERVICE] First result sample:', result?.[0] ? JSON.stringify(result[0], null, 2) : 'No results');
      
      const typedResult = result as unknown as T[];
      return typedResult;
    } catch (error) {
      console.error('❌ [BASE_SERVICE] Database query error:', error);
      console.error('❌ [BASE_SERVICE] Query that failed:', queryText);
      console.error('❌ [BASE_SERVICE] Params that failed:', params);
      console.error('❌ [BASE_SERVICE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      if (error instanceof Error) {
        console.error('❌ [BASE_SERVICE] Error message:', error.message);
        console.error('❌ [BASE_SERVICE] Error name:', error.name);
      }
      
      throw new Error(`Database operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  protected async queryOne<T = any>(
    queryText: string,
    params: any[] = []
  ): Promise<T | null> {
    console.log('🔵 [BASE_SERVICE] Executing queryOne...');
    console.log('🔵 [BASE_SERVICE] Query:', queryText);
    console.log('🔵 [BASE_SERVICE] Params:', params);
    
    try {
      const result = await this.query<T>(queryText, params);
      const firstResult = result.length > 0 ? result[0] : null;
      
      console.log('✅ [BASE_SERVICE] QueryOne result:', firstResult ? 'Found' : 'Not found');
      return firstResult;
    } catch (error) {
      console.error('❌ [BASE_SERVICE] QueryOne error:', error);
      throw error;
    }
  }

  protected async exists(
    table: string,
    condition: string,
    params: any[]
  ): Promise<boolean> {
    console.log('🔵 [BASE_SERVICE] Checking existence...');
    console.log('🔵 [BASE_SERVICE] Table:', table);
    console.log('🔵 [BASE_SERVICE] Condition:', condition);
    console.log('🔵 [BASE_SERVICE] Params:', params);
    
    try {
      const query = `SELECT EXISTS(SELECT 1 FROM ${table} WHERE ${condition}) as exists`;
      const result = await this.queryOne<{ exists: boolean }>(query, params);
      const exists = result?.exists || false;
      
      console.log('✅ [BASE_SERVICE] Existence check result:', exists);
      return exists;
    } catch (error) {
      console.error('❌ [BASE_SERVICE] Existence check error:', error);
      throw error;
    }
  }

  protected async count(
    table: string,
    condition?: string,
    params: any[] = []
  ): Promise<number> {
    console.log('🔵 [BASE_SERVICE] Counting records...');
    console.log('🔵 [BASE_SERVICE] Table:', table);
    console.log('🔵 [BASE_SERVICE] Condition:', condition);
    console.log('🔵 [BASE_SERVICE] Params:', params);
    
    try {
      const whereClause = condition ? `WHERE ${condition}` : '';
      const query = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
      const result = await this.queryOne<{ count: string }>(query, params);
      const count = parseInt(result?.count || '0');
      
      console.log('✅ [BASE_SERVICE] Count result:', count);
      return count;
    } catch (error) {
      console.error('❌ [BASE_SERVICE] Count error:', error);
      throw error;
    }
  }

  protected buildUpdateQuery(
    table: string,
    updateData: Record<string, any>,
    idField: string,
    idValue: any
  ): { query: string; params: any[] } {
    console.log('🔵 [BASE_SERVICE] Building update query...');
    console.log('🔵 [BASE_SERVICE] Table:', table);
    console.log('🔵 [BASE_SERVICE] Update data:', updateData);
    console.log('🔵 [BASE_SERVICE] ID field:', idField);
    console.log('🔵 [BASE_SERVICE] ID value:', idValue);
    
    const fields = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined && key !== idField) {
        fields.push(`${key} = ${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    params.push(idValue);

    const query = `
      UPDATE ${table} 
      SET ${fields.join(', ')}
      WHERE ${idField} = ${paramIndex}
      RETURNING *
    `;

    console.log('✅ [BASE_SERVICE] Built update query:', query);
    console.log('✅ [BASE_SERVICE] Update params:', params);

    return { query, params };
  }

  protected buildSelectQuery(
    table: string,
    fields: string = '*',
    conditions?: Record<string, any>,
    orderBy?: string,
    limit?: number,
    offset?: number
  ): { query: string; params: any[] } {
    console.log('🔵 [BASE_SERVICE] Building select query...');
    console.log('🔵 [BASE_SERVICE] Table:', table);
    console.log('🔵 [BASE_SERVICE] Fields:', fields);
    console.log('🔵 [BASE_SERVICE] Conditions:', conditions);
    
    let query = `SELECT ${fields} FROM ${table}`;
    const params: any[] = [];
    let paramIndex = 1;

    if (conditions && Object.keys(conditions).length > 0) {
      const whereConditions = [];
      for (const [key, value] of Object.entries(conditions)) {
        if (value !== undefined && value !== null) {
          whereConditions.push(`${key} = ${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }
    }

    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    if (limit) {
      query += ` LIMIT ${paramIndex}`;
      params.push(limit);
      paramIndex++;
    }

    if (offset) {
      query += ` OFFSET ${paramIndex}`;
      params.push(offset);
    }

    console.log('✅ [BASE_SERVICE] Built select query:', query);
    console.log('✅ [BASE_SERVICE] Select params:', params);

    return { query, params };
  }

  protected buildInsertQuery(
    table: string,
    data: Record<string, any>,
    returning: string = '*'
  ): { query: string; params: any[] } {
    console.log('🔵 [BASE_SERVICE] Building insert query...');
    console.log('🔵 [BASE_SERVICE] Table:', table);
    console.log('🔵 [BASE_SERVICE] Data:', data);
    
    const fields = [];
    const placeholders = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(key);
        placeholders.push(`${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to insert');
    }

    const query = `
      INSERT INTO ${table} (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING ${returning}
    `;

    console.log('✅ [BASE_SERVICE] Built insert query:', query);
    console.log('✅ [BASE_SERVICE] Insert params:', params);

    return { query, params };
  }
}