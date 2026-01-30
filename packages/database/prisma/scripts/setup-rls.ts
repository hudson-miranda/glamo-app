/**
 * GLAMO - Script de configuração RLS
 * 
 * Este script executa os arquivos SQL de RLS no banco de dados.
 * Deve ser executado após as migrations do Prisma.
 * 
 * Uso: pnpm db:setup-rls
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function setupRLS(): Promise<void> {
  console.log('🔐 Iniciando configuração de Row-Level Security...\n');

  try {
    // Ler arquivos SQL
    const setupRlsPath = join(__dirname, '..', 'rls', 'setup-rls.sql');
    const policiesPath = join(__dirname, '..', 'rls', 'policies.sql');

    console.log('📄 Lendo arquivos SQL...');
    const setupRlsSql = readFileSync(setupRlsPath, 'utf-8');
    const policiesSql = readFileSync(policiesPath, 'utf-8');

    // Executar setup-rls.sql
    console.log('\n🔧 Executando setup-rls.sql...');
    await prisma.$executeRawUnsafe(setupRlsSql);
    console.log('✅ Setup RLS executado com sucesso!');

    // Executar policies.sql
    console.log('\n🔧 Executando policies.sql...');
    await prisma.$executeRawUnsafe(policiesSql);
    console.log('✅ Policies criadas com sucesso!');

    console.log('\n🎉 Configuração de RLS concluída com sucesso!');
    console.log('\n📝 Funções disponíveis:');
    console.log('   - public.current_tenant_id()');
    console.log('   - auth.current_user_id()');
    console.log('   - auth.current_user_role()');
    console.log('   - auth.set_user_context(tenant_id, user_id, role)');
    console.log('   - auth.clear_user_context()');

  } catch (error) {
    console.error('\n❌ Erro ao configurar RLS:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
setupRLS()
  .then(() => {
    console.log('\n✨ Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Falha no script:', error);
    process.exit(1);
  });
