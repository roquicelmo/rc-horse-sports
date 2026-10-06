import React, { useState } from 'react';
import type { Competitor } from '../types/roping';
import { X, UserPlus } from 'lucide-react';

interface NewCompetitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (competitor: Competitor) => void;
}

export const NewCompetitorModal: React.FC<NewCompetitorModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [nome, setNome] = useState('');
  const [handicap, setHandicap] = useState(2.5);
  const [cidade, setCidade] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const newComp: Competitor = {
      id: `c-custom-${Date.now()}`,
      nome: nome.trim(),
      handicap,
      cidade: cidade.trim() || undefined,
    };

    onAdd(newComp);
    setNome('');
    setHandicap(2.5);
    setCidade('');
    onClose();
  };

  const handicapOptions = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Inscrever Novo Competidor</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Nome Completo do Laçador
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Pedro Henrique, Juninho..."
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Handicap Oficial (1.0 a 5.0)
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {handicapOptions.map((hcp) => (
                <button
                  key={hcp}
                  type="button"
                  onClick={() => setHandicap(hcp)}
                  className={`py-1.5 rounded-lg text-xs font-bold font-mono transition ${
                    handicap === hcp
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {hcp.toFixed(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Cidade / Haras / Rancho (Opcional)
            </label>
            <input
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Ex: Barretos - SP"
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
            >
              Cadastrar Competidor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
