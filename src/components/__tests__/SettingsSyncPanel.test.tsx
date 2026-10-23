import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { SettingsSyncPanel } from '../SettingsSyncPanel';
import { useSettingsSync } from '../../services/personalSettingsSync';
import {
  getSupabaseConfigHealth,
  verifySupabaseConfiguration,
  type SupabaseConfigHealth,
} from '../../lib/supabase';

const blockedHealth: SupabaseConfigHealth = {
  targetProjectRef: 'njgzhjwfcxdxiibkuuqg',
  activeProjectRef: 'njgzhjwfcxdxiibkuuqg',
  activeUrl: 'https://njgzhjwfcxdxiibkuuqg.supabase.co',
  configuredProjectRef: 'njgzhjwfcxdxiibkuuqg',
  urlStatus: 'valid',
  keyStatus: 'unverified',
  keyFormat: 'modern_publishable',
  configurationState: 'unverified',
  severity: 'warning',
  isHealthy: false,
  appVersion: '2.1.1',
  errorMessage: 'Clave pública pendiente de verificación; no se confirmó una discrepancia.',
};

const currentUser = {
  id: 'test-user',
  email: 'pruebas@finper.local',
} as User;

describe('SettingsSyncPanel colapsable con alertas', () => {
  beforeEach(() => {
    cleanup();
    sessionStorage.clear();
    vi.mocked(getSupabaseConfigHealth).mockReturnValue(blockedHealth);
    vi.mocked(verifySupabaseConfiguration).mockResolvedValue(blockedHealth);
    useSettingsSync.setState({
      entries: {
        budgets: { status: 'error', message: 'Pendiente de reintento' },
        projections: { status: 'waiting' },
        statements: { status: 'waiting' },
        classifications: { status: 'waiting' },
      },
    });
  });

  it('permite cerrar, conserva la alerta compacta y vuelve a abrir con needsAttention activo', () => {
    render(<SettingsSyncPanel currentUser={currentUser} />);

    expect(screen.queryByText('Movimientos en Cola')).toBeNull();
    expect(screen.getByRole('alert').textContent).toContain('no se confirmó una discrepancia');
    expect(screen.getByText(/Módulos con problemas: 1/)).toBeTruthy();
    expect(screen.getByText(/Operaciones pendientes: 0/)).toBeTruthy();

    const expandButton = screen.getByRole('button', { name: 'Expandir panel de sincronización' });
    expect(expandButton.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(expandButton);

    expect(screen.getByText('Movimientos en Cola')).toBeTruthy();
    const collapseButton = screen.getByRole('button', { name: 'Colapsar panel de sincronización' });
    expect(collapseButton.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(collapseButton);

    expect(screen.queryByText('Movimientos en Cola')).toBeNull();
    expect(screen.getByRole('alert').textContent).toContain('Las escrituras permanecen protegidas');

    fireEvent.click(screen.getByRole('button', { name: 'Expandir panel de sincronización' }));
    expect(screen.getByText('Movimientos en Cola')).toBeTruthy();
  });

  it('recuerda la expansión durante la sesión del navegador', () => {
    const first = render(<SettingsSyncPanel currentUser={currentUser} />);
    fireEvent.click(screen.getByRole('button', { name: 'Expandir panel de sincronización' }));
    first.unmount();

    render(<SettingsSyncPanel currentUser={currentUser} />);
    expect(screen.getByRole('button', { name: 'Colapsar panel de sincronización' }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Movimientos en Cola')).toBeTruthy();
  });
});
