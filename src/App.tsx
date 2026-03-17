import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import logoFt from './assets/logo.png';
import { 
  Settings, 
  User, 
  Plus, 
  ChevronRight, 
  CheckCircle2, 
  Search, 
  ArrowLeft,
  Calendar,
  LogOut,
  Trash2,
  BarChart3,
  Users,
  ClipboardList,
  ClipboardCheck,
  Star,
  TrendingUp,
  Clock,
  Link as LinkIcon,
  Copy,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  Edit3,
  Save,
  X,
  History
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  PieChart,
  Pie,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LabelList,
  Legend
} from 'recharts';
import { ClientConfig, ServiceType, SurveyResponse, ModuleConfig } from './types';
import { COLORS, DEFAULT_MODULES } from './constants';
import {
  getInitialData,
  getClientBySlug,
  createClient,
  updateClient,
  deleteClient as deleteClientApi,
  saveSurveyResponse,
  saveSurveyConfig,
  uploadLogo,
} from './services/api';

// --- Shared Components ---

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '',
  disabled = false,
  type = 'button'
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger',
  className?: string,
  disabled?: boolean,
  type?: 'button' | 'submit'
}) => {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const style = variant === 'primary' ? { backgroundColor: COLORS.primary, color: 'white' } : 
                variant === 'secondary' ? { backgroundColor: COLORS.accent, color: 'white' } : 
                variant === 'danger' ? { backgroundColor: '#ef4444', color: 'white' } : {};

  const variantClasses = {
    primary: "hover:opacity-90",
    secondary: "hover:opacity-90",
    outline: `border-2 border-[#101c30] text-[#101c30] hover:bg-[#101c30] hover:text-white`,
    ghost: `text-[#101c30] hover:bg-gray-100`,
    danger: "hover:bg-red-600",
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variantClasses[variant]} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
  >
    {children}
  </div>
);

const Input = ({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <input 
      {...props} 
      className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#fa5800] focus:border-transparent transition-all"
    />
  </div>
);

const Select = ({ label, options, ...props }: { label?: string, options: {value: string, label: string}[] } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <select 
      {...props} 
      className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#fa5800] focus:border-transparent transition-all bg-white"
    >
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

// --- Helper Functions ---

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';

  const date = new Date(dateString);

  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const getScoreColor = (score: number) => {
  if (score >= 4.5) return '#10b981'; // Green (Promoter)
  if (score >= 3.5) return '#f59e0b'; // Yellow (Passive)
  return '#ef4444'; // Red (Detractor)
};

const getClientStatus = (range: { start: string, end: string } | undefined) => {
  if (!range || !range.start || !range.end) return { label: 'Sin Configurar', color: 'bg-gray-100 text-gray-500' };
  const now = new Date();
  const start = new Date(range.start);
  const end = new Date(range.end);
  
  // Normalize dates to ignore time for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (today < startDate) return { label: 'Programado', color: 'bg-blue-100 text-blue-600' };
  if (today > endDate) return { label: 'Finalizado', color: 'bg-gray-100 text-gray-400' };
  return { label: 'Activo', color: 'bg-emerald-100 text-emerald-600' };
};

const hasEvaluatedInRange = (clientId: string, range: { start: string, end: string } | undefined, responses: SurveyResponse[]) => {
  if (!range || !range.start || !range.end) return false;
  
  return responses.some(resp => {
    if (resp.clientId !== clientId) return false;
    
    // Si la respuesta tiene el rango guardado, comparamos el rango exacto
    if (resp.evaluationRange) {
      return resp.evaluationRange.start === range.start && resp.evaluationRange.end === range.end;
    }
    
    // Fallback para respuestas antiguas basado en fechas
    const respDate = new Date(resp.date);
    const startDate = new Date(range.start);
    const endDate = new Date(range.end);
    return respDate >= startDate && respDate <= endDate;
  });
};

// --- Results Dashboard ---

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

function ResultsDashboard({ responses, clients, surveyConfig }: { responses: SurveyResponse[], clients: ClientConfig[], surveyConfig: Record<string, ModuleConfig[]> }) {
  const [filterService, setFilterService] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const { width } = useWindowSize();
  const isMobile = width < 640;

  const filteredResponses = useMemo(() => {
    return responses.filter(resp => {
      const client = clients.find(c => c.id === resp.clientId);
      if (!client) return false;
      
      const matchesService = filterService === 'all' || client.services.includes(filterService);
      
      const respDate = new Date(resp.date);
      const matchesStart = !dateRange.start || respDate >= new Date(dateRange.start);
      const matchesEnd = !dateRange.end || respDate <= new Date(dateRange.end);
      
      return matchesService && matchesStart && matchesEnd;
    });
  }, [responses, clients, filterService, dateRange]);

  const stats = useMemo(() => {
    if (filteredResponses.length === 0) return { avg: 0, count: 0, byService: [], clientSatisfaction: [], comments: [], uniqueClients: 0 };

    let totalRating = 0;
    let ratingCount = 0;
    const serviceScores: Record<string, { total: number, count: number, clientIds: Set<string> }> = {};
    const clientScores: Record<string, { total: number, count: number, name: string }> = {};
    const comments: { client: string, text: string, date: string, score: number, service: string }[] = [];
    const uniqueClientsInPeriod = new Set<string>();

    filteredResponses.forEach(resp => {
      const client = clients.find(c => c.id === resp.clientId);
      if (!client) return;
      
      uniqueClientsInPeriod.add(client.id);
      let respTotal = 0;
      let respCount = 0;

      resp.answers.forEach(ans => {
        if (typeof ans.value === 'number') {
          totalRating += ans.value;
          ratingCount++;
          respTotal += ans.value;
          respCount++;

          const service = client.services.find(s => 
            (surveyConfig[s] || []).some(m => m.questions.some(q => q.id === ans.questionId))
          ) || 'Otros';

          if (!serviceScores[service]) serviceScores[service] = { total: 0, count: 0, clientIds: new Set() };
          serviceScores[service].total += ans.value;
          serviceScores[service].count++;
          serviceScores[service].clientIds.add(client.id);
        } else if (typeof ans.value === 'string' && ans.questionId !== 'survey-date' && ans.value.trim() !== '') {
          const service = client.services.find(s => 
            (surveyConfig[s] || []).some(m => m.questions.some(q => q.id === ans.questionId))
          ) || 'Otros';

          comments.push({
            client: client.companyName,
            text: ans.value,
            date: resp.date,
            score: 0,
            service
          });
        }
      });

      if (respCount > 0) {
        const avg = respTotal / respCount;
        if (!clientScores[client.id]) {
          clientScores[client.id] = { total: 0, count: 0, name: client.companyName };
        }
        clientScores[client.id].total += avg;
        clientScores[client.id].count++;
        
        comments.forEach(c => {
          if (c.client === client.companyName && c.date === resp.date) {
            c.score = Number(avg.toFixed(1));
          }
        });
      }
    });

    const byService = Object.entries(serviceScores).map(([name, data]) => ({
      name,
      value: Number((data.total / data.count).toFixed(2)),
      respondents: data.clientIds.size
    }));

    const clientSatisfaction = Object.values(clientScores).map(data => ({
      name: data.name,
      value: Number((data.total / data.count).toFixed(2))
    })).sort((a, b) => b.value - a.value);

    return {
      avg: Number((totalRating / ratingCount).toFixed(2)),
      count: filteredResponses.length,
      byService,
      clientSatisfaction,
      comments,
      uniqueClients: uniqueClientsInPeriod.size
    };
  }, [filteredResponses, clients, surveyConfig]);

  const activeProducts = useMemo(() => {
    const products = new Set<string>();
    filteredResponses.forEach(resp => {
      const client = clients.find(c => c.id === resp.clientId);
      client?.services.forEach(s => products.add(s));
    });
    return Array.from(products);
  }, [filteredResponses, clients]);

  return (
    <div className="space-y-8">
      {/* Filters */}
      <Card className="bg-white border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select 
            label="Producto / Servicio"
            value={filterService}
            onChange={e => setFilterService(e.target.value)}
            options={[
              { value: 'all', label: 'Todos los Productos' },
              ...Object.keys(surveyConfig).map(s => ({ value: s, label: s }))
            ]}
          />
          <Input 
            label="Desde"
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange({...dateRange, start: e.target.value})}
          />
          <Input 
            label="Hasta"
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange({...dateRange, end: e.target.value})}
          />
        </div>
      </Card>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-[#101c30] text-white border-none">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest opacity-60">Total Evaluaciones</p>
              <ClipboardCheck size={18} className="opacity-60" />
            </div>
            <h3 className="text-4xl font-bold">{stats.count}</h3>
            <p className="text-xs opacity-60">Encuestas completadas en total</p>
          </div>
        </Card>

        <Card className="bg-white border-gray-100">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Clientes Únicos</p>
              <Users size={18} className="text-gray-400" />
            </div>
            <h3 className="text-4xl font-bold text-[#101c30]">{stats.uniqueClients}</h3>
            <p className="text-xs text-gray-400">Empresas que han participado</p>
          </div>
        </Card>

        <Card className="bg-white border-gray-100">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Rango de Fechas</p>
              <Calendar size={18} className="text-gray-400" />
            </div>
            <div className="space-y-1">
<p className="text-sm font-bold">
  {dateRange.start ? formatDate(dateRange.start) : 'Inicio'} — {dateRange.end ? formatDate(dateRange.end) : 'Fin'}
</p>
              <p className="text-xs text-gray-400">Periodo de análisis seleccionado</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white border-gray-100">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Productos</p>
              <ClipboardList size={18} className="text-gray-400" />
            </div>
            <div className="flex flex-wrap gap-1">
              {activeProducts.length > 0 ? activeProducts.map(p => (
                <span key={p} className="text-[9px] px-2 py-0.5 bg-gray-100 rounded-full font-bold text-gray-500 uppercase">{p}</span>
              )) : <span className="text-xs text-gray-400 italic">Sin datos</span>}
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="flex flex-col items-center justify-center text-center py-12">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-8">Nota Global Promedio</h4>
          <div 
            className="w-48 h-48 rounded-full border-[14px] flex flex-col items-center justify-center transition-colors duration-500"
            style={{ borderColor: getScoreColor(stats.avg), color: getScoreColor(stats.avg) }}
          >
            <span className="text-6xl font-bold">{stats.avg || 0}</span>
            <span className="text-sm font-bold opacity-60">/ 5.0</span>
            <div className="mt-2 text-[10px] font-bold uppercase tracking-widest opacity-40">
              {stats.count} Evaluaciones
            </div>
          </div>
        </Card>

        <Card className="h-[350px] sm:h-[500px]">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-10">Nota Promedio por Producto</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.byService} margin={{ top: 20, right: 10, left: -20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                fontSize={10} 
                angle={-45} 
                textAnchor="end" 
                interval={0}
                height={80}
              />
              <YAxis domain={[0, 5]} fontSize={10} />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 shadow-xl border border-gray-100 rounded-xl text-xs space-y-1">
                        <p className="font-bold text-[#101c30]">{data.name}</p>
                        <p className="text-[#fa5800]">Nota: <span className="font-bold">{data.value}</span></p>
                        <p className="text-gray-400">Encuestados: <span className="font-bold">{data.respondents}</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={50}>
                {stats.byService.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getScoreColor(entry.value)} />
                ))}
                <LabelList 
                  dataKey="value" 
                  position="top" 
                  fontSize={10} 
                  className="font-bold fill-gray-400"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="h-[350px] sm:h-[400px]">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Distribución de Encuestados por Producto</h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.byService}
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 40 : 60}
                outerRadius={isMobile ? 70 : 100}
                paddingAngle={5}
                dataKey="respondents"
                nameKey="name"
                label={isMobile ? false : ({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {stats.byService.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 shadow-xl border border-gray-100 rounded-xl text-xs">
                        <p className="font-bold text-[#101c30]">{data.name}</p>
                        <p className="text-[#fa5800]">Encuestados: <span className="font-bold">{data.respondents}</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Client Satisfaction Table */}
      <Card className="overflow-hidden p-0 border-gray-100">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Ranking de Satisfacción por Cliente</h4>
          <TrendingUp size={16} className="text-gray-300" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <th className="px-6 py-3">Posición</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Nota Promedio</th>
                <th className="px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.clientSatisfaction.map((client, idx) => (
                <tr key={client.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-gray-300">#{idx + 1}</td>
                  <td className="px-6 py-4 text-sm font-bold">{client.name}</td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-bold" style={{ color: getScoreColor(client.value) }}>{client.value}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: getScoreColor(client.value) }}
                    ></div>
                  </td>
                </tr>
              ))}
              {stats.clientSatisfaction.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic text-sm">No hay datos disponibles para este periodo</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Comments */}
      <Card className="border-gray-100">
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
          <Clock size={16} /> Comentarios y Sugerencias
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.comments.map((comment, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-gray-50 bg-gray-50/30 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold">{comment.client}</p>
                    <span className="text-[9px] px-1.5 py-0.5 bg-gray-200 rounded text-gray-500 font-bold uppercase">{comment.service}</span>
                  </div>
<p className="text-[10px] text-gray-400">{formatDate(comment.date)}</p>
                </div>
                <div 
                  className="px-2 py-1 rounded text-[10px] font-bold text-white"
                  style={{ backgroundColor: getScoreColor(comment.score) }}
                >
                  {comment.score}
                </div>
              </div>
              <p className="text-sm text-gray-600 italic leading-relaxed">"{comment.text}"</p>
            </div>
          ))}
          {stats.comments.length === 0 && (
            <div className="col-span-2 py-10 text-center text-gray-400 italic text-sm">No hay comentarios registrados</div>
          )}
        </div>
      </Card>
    </div>
  );
}

// --- Survey Form Component ---

function SurveyForm({
  client,
  onSubmit,
  surveyConfig,
  isSaving
}: {
  client: ClientConfig;
  onSubmit: (answers: { questionId: string; value: string | number }[]) => void;
  surveyConfig: Record<string, ModuleConfig[]>;
  isSaving: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

  const modules = useMemo(() => {
    const allModules: (ModuleConfig & { serviceName: string })[] = [];
    client.services.forEach(service => {
      (surveyConfig[service] || []).forEach(mod => {
        if (client.activeModules.includes(mod.id)) {
          allModules.push({ ...mod, serviceName: service });
        }
      });
    });
    return allModules;
  }, [client, surveyConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedAnswers = Object.entries(answers).map(([id, val]) => ({
      questionId: id,
      value: val
    }));
    formattedAnswers.push({ questionId: 'survey-date', value: currentDate });
    onSubmit(formattedAnswers);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12 pb-20">
      <Card className="bg-orange-50 border-orange-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="text-[#fa5800]" />
            <span className="font-medium">Fecha de Evaluación</span>
          </div>
          <input 
            type="date" 
            className="px-4 py-2 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-[#fa5800] bg-white"
            value={currentDate}
            onChange={e => setCurrentDate(e.target.value)}
            required
          />
        </div>
      </Card>

      {modules.map((module, mIdx) => (
        <div key={module.id} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-[#101c30] text-white flex items-center justify-center font-bold text-sm">
              {mIdx + 1}
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                Producto: {module.serviceName}
              </p>
              <h3 className="text-xl font-bold text-[#101c30]">
                {module.serviceName} - {module.name}
              </h3>
            </div>
          </div>

          <div className="space-y-4">
            {module.questions.map(q => (
              <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <p className="font-medium text-lg leading-tight">{q.text}</p>
                
                {q.type === 'rating' && (
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        type="button"
                        disabled={isSaving}
                        onClick={() => setAnswers({ ...answers, [q.id]: num })}
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 transition-all flex items-center justify-center font-bold text-base sm:text-lg
                          ${answers[q.id] === num 
                            ? 'bg-[#fa5800] border-[#fa5800] text-white scale-110 shadow-lg' 
                            : 'bg-white border-gray-100 text-gray-400 hover:border-orange-200 hover:text-orange-400'}
                          ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {num}
                      </button>
                    ))}
                    <div className="w-full flex justify-between px-1 mt-1 text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                      <span>Muy Insatisfecho</span>
                      <span>Excelente</span>
                    </div>
                  </div>
                )}

                {q.type === 'text' && (
                  <textarea 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#fa5800] focus:border-transparent transition-all min-h-[100px]"
                    placeholder="Escribe tu respuesta aquí..."
                    value={(answers[q.id] as string) || ''}
                    onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                    disabled={isSaving}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 sm:bg-transparent sm:backdrop-blur-none sm:border-none sm:relative sm:p-0 sm:mt-12">
        <div className="max-w-4xl mx-auto">
          <Button
            type="submit"
            variant="secondary"
            className="w-full py-4 text-lg shadow-xl shadow-orange-200"
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Enviando...</span>
              </div>
            ) : (
              'Enviar Encuesta'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}



// --- Config Editor Component ---

function ConfigEditor({ config, onSave }: { config: Record<string, ModuleConfig[]>, onSave: (newConfig: Record<string, ModuleConfig[]>) => void }) {
  const [localConfig, setLocalConfig] = useState(config);
  const [newServiceName, setNewServiceName] = useState('');

  const handleAddService = () => {
    if (newServiceName && !localConfig[newServiceName]) {
      setLocalConfig({ ...localConfig, [newServiceName]: [] });
      setNewServiceName('');
    }
  };

  const handleRemoveService = (service: string) => {
    const newConfig = { ...localConfig };
    delete newConfig[service];
    setLocalConfig(newConfig);
  };

  const handleAddModule = (service: string) => {
    const newModule: ModuleConfig = {
      id: `mod-${Date.now()}`,
      name: 'Nuevo Módulo',
      questions: [{ id: `q-${Date.now()}`, text: 'Nueva Pregunta', type: 'rating' }]
    };
    setLocalConfig({
      ...localConfig,
      [service]: [...localConfig[service], newModule]
    });
  };

  const handleUpdateModule = (service: string, modId: string, updates: Partial<ModuleConfig>) => {
    setLocalConfig({
      ...localConfig,
      [service]: localConfig[service].map(m => m.id === modId ? { ...m, ...updates } : m)
    });
  };

  const handleAddQuestion = (service: string, modId: string) => {
    const newQuestion = { id: `q-${Date.now()}`, text: 'Nueva Pregunta', type: 'rating' as const };
    setLocalConfig({
      ...localConfig,
      [service]: localConfig[service].map(m => m.id === modId ? { ...m, questions: [...m.questions, newQuestion] } : m)
    });
  };

  const handleUpdateQuestion = (service: string, modId: string, qId: string, updates: any) => {
    setLocalConfig({
      ...localConfig,
      [service]: localConfig[service].map(m => m.id === modId ? {
        ...m,
        questions: m.questions.map(q => q.id === qId ? { ...q, ...updates } : q)
      } : m)
    });
  };

  const handleRemoveQuestion = (service: string, modId: string, qId: string) => {
    setLocalConfig({
      ...localConfig,
      [service]: localConfig[service].map(m => m.id === modId ? {
        ...m,
        questions: m.questions.filter(q => q.id !== qId)
      } : m)
    });
  };

  const handleRemoveModule = (service: string, modId: string) => {
    setLocalConfig({
      ...localConfig,
      [service]: localConfig[service].filter(m => m.id !== modId)
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-[#101c30]">Configuración de Servicios y Preguntas</h3>
        <Button onClick={() => onSave(localConfig)} variant="secondary" className="gap-2">
          <Save size={18} /> Guardar Cambios
        </Button>
      </div>

      <Card className="bg-gray-50 border-dashed border-2">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input 
            placeholder="Nombre del nuevo servicio..." 
            value={newServiceName}
            onChange={e => setNewServiceName(e.target.value)}
          />
          <Button onClick={handleAddService} className="whitespace-nowrap">
            <Plus size={18} /> Agregar Servicio
          </Button>
        </div>
      </Card>

      <div className="space-y-6">
        {(Object.entries(localConfig) as [string, ModuleConfig[]][]).map(([service, modules]) => (
          <div key={service}>
            <Card className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h4 className="text-lg font-bold text-[#fa5800]">{service}</h4>
              <div className="flex gap-2">
                <Button variant="ghost" className="text-red-500" onClick={() => handleRemoveService(service)}>
                  <Trash2 size={18} />
                </Button>
                <Button onClick={() => handleAddModule(service)} variant="outline" className="text-xs">
                  <Plus size={14} /> Módulo
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {modules.map(mod => (
                <div key={mod.id} className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-100">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <Input 
                      value={mod.name}
                      onChange={e => handleUpdateModule(service, mod.id, { name: e.target.value })}
                      className="font-bold flex-1"
                    />
                    <Button variant="ghost" className="text-red-500 self-end sm:self-auto" onClick={() => handleRemoveModule(service, mod.id)}>
                      <X size={18} />
                    </Button>
                  </div>

                  <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                    {mod.questions.map(q => (
                      <div key={q.id} className="flex gap-3 items-start">
                        <div className="flex-1 space-y-2">
                          <Input 
                            value={q.text}
                            onChange={e => handleUpdateQuestion(service, mod.id, q.id, { text: e.target.value })}
                            className="text-sm"
                          />
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-xs">
                              <input 
                                type="radio" 
                                checked={q.type === 'rating'} 
                                onChange={() => handleUpdateQuestion(service, mod.id, q.id, { type: 'rating' })}
                              /> Nota (1-5)
                            </label>
                            <label className="flex items-center gap-2 text-xs">
                              <input 
                                type="radio" 
                                checked={q.type === 'text'} 
                                onChange={() => handleUpdateQuestion(service, mod.id, q.id, { type: 'text' })}
                              /> Texto Libre
                            </label>
                          </div>
                        </div>
                        <Button variant="ghost" className="text-gray-400 hover:text-red-500" onClick={() => handleRemoveQuestion(service, mod.id, q.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                    <Button variant="ghost" className="text-xs text-blue-500" onClick={() => handleAddQuestion(service, mod.id)}>
                      <Plus size={14} /> Agregar Pregunta
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main App ---

export default function App() {
const [view, setView] = useState<'admin' | 'client' | 'survey' | 'admin-login' | 'client-welcome'>('admin-login');  const [adminTab, setAdminTab] = useState<'clients' | 'results' | 'config'>('clients');
  const [clients, setClients] = useState<ClientConfig[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [surveyConfig, setSurveyConfig] = useState<Record<string, ModuleConfig[]>>(DEFAULT_MODULES);
  const [selectedClient, setSelectedClient] = useState<ClientConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientConfig | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [newClient, setNewClient] = useState<Partial<ClientConfig>>({
    companyName: '',
    services: [],
    activeModules: [],
    evaluationRange: { start: '', end: '' },
    evaluationHistory: [],
    logoUrl: '',
    logoFileId: ''
  });

  // Load data from Apps Script and handle URL params
  useEffect(() => {
    const loadAppData = async () => {
      try {
        setIsLoading(true);

        const data = await getInitialData();
        setClients(data.clients || []);
        setResponses(data.responses || []);
        setSurveyConfig(data.surveyConfig || DEFAULT_MODULES);

        const params = new URLSearchParams(window.location.search);
        const clientId = params.get('clientId');
        const clientSlug = params.get('client');

        if (clientId) {
          const found = (data.clients || []).find((c: ClientConfig) => c.id === clientId);
          if (found) {
            setSelectedClient(found);
            setView('client-welcome');
          }
        } else if (clientSlug) {
          const found = await getClientBySlug(clientSlug);
          if (found) {
            setSelectedClient(found);
            setView('client-welcome');
          }
        }
      } catch (error) {
        console.error(error);
        alert('No se pudo cargar la información desde Google Sheets.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAppData();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.companyName) return;

    try {
      setIsSaving(true);

      const payload: ClientConfig = {
        id: editingClient?.id || '',
        companyName: newClient.companyName || '',
        services: (newClient.services || []) as ServiceType[],
        activeModules: newClient.activeModules || [],
        evaluationRange: newClient.evaluationRange,
        evaluationHistory: newClient.evaluationHistory || [],
        logoUrl: newClient.logoUrl || '',
        logoFileId: newClient.logoFileId || '',
        lastSurveyDate: editingClient?.lastSurveyDate || '',
      };

      let savedClient: ClientConfig;

      if (editingClient) {
        savedClient = await updateClient(payload as ClientConfig & { id: string });
        setClients(prev => prev.map(c => (c.id === editingClient.id ? savedClient : c)));
      } else {
        savedClient = await createClient(payload);
        setClients(prev => [...prev, savedClient]);
      }

      setIsAddingClient(false);
      setEditingClient(null);
      setNewClient({
        companyName: '',
        services: [],
        activeModules: [],
        evaluationRange: { start: '', end: '' },
        evaluationHistory: [],
        logoUrl: '',
        logoFileId: '',
      });
    } catch (error) {
      console.error(error);
      alert('No se pudo guardar el cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await deleteClientApi(id);
      setClients(prev => prev.filter(c => c.id !== id));
      setResponses(prev => prev.filter(r => r.clientId !== id));
    } catch (error) {
      console.error(error);
      alert('No se pudo eliminar el cliente.');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail.endsWith('@metodosft.com')) {
      setIsLoggedIn(true);
      setView('admin');
    } else {
      alert('Acceso denegado. Por favor usa un correo con dominio @metodosft.com');
    }
  };

  const copyClientLink = (client: ClientConfig) => {
    const slug = slugify(client.companyName);
    const url = `${window.location.origin}${window.location.pathname}?client=${slug}`;
    navigator.clipboard.writeText(url);
    alert('Link copiado al portapapeles: ' + url);
  };

  const handleSurveySubmit = async (answers: { questionId: string; value: string | number }[]) => {
    if (!selectedClient) return;

    try {
      setIsSaving(true);

      const response = await saveSurveyResponse({
        clientId: selectedClient.id,
        answers,
      });

      setResponses(prev => [...prev, response]);
      setIsSubmitted(true);

      setClients(prev =>
        prev.map(client =>
          client.id === selectedClient.id
            ? { ...client, lastSurveyDate: response.date }
            : client
        )
      );
    } catch (error) {
      console.error(error);
      alert('No se pudo guardar la encuesta.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

    if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-[#fa5800] rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Cargando información...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
onClick={() => {
  setSelectedClient(null);
  setIsSubmitted(false);
  setView('admin-login');
}}
          >
<div 
  className="flex items-center gap-3 cursor-pointer" 
  onClick={() => {
    setSelectedClient(null);
    setIsSubmitted(false);
    setView('admin-login');
  }}
>
  <img src={logoFt} alt="FT Group" className="h-10 w-auto object-contain" />
  <span className="font-bold text-xl tracking-tight text-[#fa5800]">
    FT Group
  </span>
</div>
          
{view === 'admin' && (
  <Button
    variant="ghost"
    onClick={() => {
      setIsLoggedIn(false);
      setSelectedClient(null);
      setIsSubmitted(false);
      setLoginEmail('');
      setView('admin-login');
    }}
  >
    <LogOut size={18} />
    <span className="hidden sm:inline">Salir</span>
  </Button>
)}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {view === 'admin-login' && (
            <motion.div 
              key="admin-login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto py-20 space-y-8"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">Acceso Administrativo</h2>
                <p className="text-gray-500">Ingresa tu correo corporativo para gestionar la plataforma.</p>
              </div>
              <Card>
                <form onSubmit={handleLogin} className="space-y-6">
                  <Input 
                    label="Correo Electrónico"
                    type="email"
                    placeholder="usuario@metodosft.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" variant="primary" className="w-full py-3">
                    Ingresar al Panel
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}

          {view === 'client-welcome' && selectedClient && (
            <motion.div 
              key="client-welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto py-20 text-center space-y-12"
            >
              <div className="space-y-6">
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-gray-100 overflow-hidden p-2">
                  {selectedClient.logoUrl ? (
                    <img src={selectedClient.logoUrl} alt={selectedClient.companyName} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-orange-50 flex items-center justify-center text-[#fa5800]">
                      <ClipboardList size={40} />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-[#fa5800] font-bold uppercase tracking-widest text-[10px] sm:text-xs">Evaluación de Servicio</p>
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#101c30]">{selectedClient.companyName}</h2>
                </div>
                <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
                  Gracias por confiar en nosotros. Esta evaluación nos permitirá medir la calidad de los servicios que te brindamos actualmente y asegurar que estamos cumpliendo con tus expectativas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <Card className="bg-white border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Periodo</p>
<p className="text-sm font-bold">
  {formatDate(selectedClient.evaluationRange?.start)} al {formatDate(selectedClient.evaluationRange?.end)}
</p>
                </Card>
                <Card className="bg-white border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Servicios</p>
                  <p className="text-sm font-bold">{selectedClient.services.join(', ')}</p>
                </Card>
              </div>

{hasEvaluatedInRange(selectedClient.id, selectedClient.evaluationRange, responses) ? (
  <div className="space-y-6">
    <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col items-center gap-4">
      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
        <CheckCircle2 size={24} />
      </div>
      <div className="space-y-1">
        <p className="text-emerald-800 font-bold">Evaluación Completada</p>
        <p className="text-emerald-600 text-sm">
          Ya has realizado la evaluación correspondiente a este periodo. ¡Gracias por tu participación!
        </p>
      </div>
    </div>
  </div>
) : (

              
                <Button 
                  variant="secondary" 
                  className="w-full py-5 text-xl shadow-xl shadow-orange-200"
                  onClick={() => setView('survey')}
                >
                  Comenzar Evaluación
                </Button>
              )}
            </motion.div>
          )}

          {view === 'admin' && isLoggedIn && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101c30]">Panel de Control</h2>
                  <p className="text-sm sm:text-base text-gray-500">Gestiona la experiencia de tus clientes y analiza resultados.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                    <button 
                      onClick={() => setAdminTab('clients')}
                      className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${adminTab === 'clients' ? 'bg-white shadow-sm text-[#fa5800]' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Clientes
                    </button>
                    <button 
                      onClick={() => setAdminTab('results')}
                      className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${adminTab === 'results' ? 'bg-white shadow-sm text-[#fa5800]' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Resultados
                    </button>
                    <button 
                      onClick={() => setAdminTab('config')}
                      className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${adminTab === 'config' ? 'bg-white shadow-sm text-[#fa5800]' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Configuración
                    </button>
                  </div>
<Button
  variant="ghost"
  className="text-red-500 h-11 w-11 p-0 rounded-xl hover:bg-red-50"
  onClick={() => {
    setIsLoggedIn(false);
    setSelectedClient(null);
    setIsSubmitted(false);
    setLoginEmail('');
    setView('admin-login');
  }}
>
  <LogOut size={20} />
</Button>
                </div>
              </div>

              {adminTab === 'clients' ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">Gestión de Clientes</h3>
<Button onClick={() => {
  setEditingClient(null);
  setNewClient({
    companyName: '',
    services: [],
    activeModules: [],
    evaluationRange: { start: '', end: '' },
    evaluationHistory: [],
    logoUrl: '',
    logoFileId: ''
  });
  setIsAddingClient(true);
}}>
  <Plus size={18} /> Nuevo Cliente
</Button>
                  </div>

                  {isAddingClient && (
                    <Card className="border-2 border-orange-100">
                      <form onSubmit={handleAddClient} className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-lg">{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                          <Button variant="ghost" onClick={() => setIsAddingClient(false)}>Cancelar</Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <Input 
                              label="Nombre de la Empresa" 
                              placeholder="Ej. Mi Empresa S.A." 
                              value={newClient.companyName}
                              onChange={e => setNewClient({...newClient, companyName: e.target.value})}
                              required
                            />

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Logo de la Empresa</label>
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
                                  {newClient.logoUrl ? (
                                    <img src={newClient.logoUrl} alt="Logo preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                  ) : (
                                    <ImageIcon className="text-gray-300" size={24} />
                                  )}
                                </div>
                                <label className="cursor-pointer bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                                  <Upload size={16} /> Subir Logo
<input 
  type="file" 
  className="hidden" 
  accept="image/*"
  onChange={async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const result = await uploadLogo({
            clientId: editingClient?.id || '',
            fileName: file.name,
            mimeType: file.type || 'image/png',
            base64: reader.result as string,
          });

          setNewClient(prev => ({
            ...prev,
            logoUrl: result.fileUrl,
            logoFileId: result.fileId,
          }));
        } catch (error) {
          console.error(error);
          alert('No se pudo subir el logo.');
        } finally {
          setIsSaving(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setIsSaving(false);
      alert('No se pudo procesar el archivo.');
    }
  }}
/>
                                </label>
                                {newClient.logoUrl && (
                                  <button 
                                    type="button" 
                                    onClick={() =>
  setNewClient(prev => ({
    ...prev,
    logoUrl: '',
    logoFileId: ''
  }))
}
                                    className="text-xs text-red-500 font-bold hover:underline"
                                  >
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Servicios Contratados</label>
                              <div className="grid grid-cols-1 gap-2">
                                {Object.keys(surveyConfig).map(service => (
                                  <label key={service} className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={newClient.services?.includes(service)}
                                      onChange={e => {
                                        const services = newClient.services || [];
                                        if (e.target.checked) {
                                          setNewClient({...newClient, services: [...services, service]});
                                        } else {
                                          setNewClient({...newClient, services: services.filter(s => s !== service)});
                                        }
                                      }}
                                      className="w-4 h-4 accent-[#fa5800]"
                                    />
                                    <span className="text-sm">{service}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-700">Rango de Evaluación</label>
                                {newClient.evaluationRange?.start && newClient.evaluationRange?.end && (
                                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getClientStatus(newClient.evaluationRange as any).color}`}>
                                    {getClientStatus(newClient.evaluationRange as any).label}
                                  </div>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Input 
                                  type="date" 
                                  value={newClient.evaluationRange?.start} 
                                  onChange={e => setNewClient({...newClient, evaluationRange: { ...newClient.evaluationRange!, start: e.target.value }})}
                                />
                                <Input 
                                  type="date" 
                                  value={newClient.evaluationRange?.end} 
                                  onChange={e => setNewClient({...newClient, evaluationRange: { ...newClient.evaluationRange!, end: e.target.value }})}
                                />
                              </div>
                              <button 
                                type="button" 
                                onClick={() => {
                                  const history = newClient.evaluationHistory || [];
                                  const currentRange = newClient.evaluationRange;
                                  if (currentRange?.start && currentRange?.end) {
                                    setNewClient({
                                      ...newClient, 
                                      evaluationRange: { start: '', end: '' },
                                      evaluationHistory: [...history, currentRange]
                                    });
                                  } else {
                                    setNewClient({...newClient, evaluationRange: { start: '', end: '' }});
                                  }
                                }}
                                className="text-[10px] font-bold text-[#fa5800] uppercase hover:underline mt-1"
                              >
                                + Iniciar Nuevo Periodo
                              </button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="text-sm font-medium text-gray-700">Módulos Activos para Evaluar</label>
                            <div className="max-h-[400px] overflow-y-auto border border-gray-100 rounded-lg p-2 space-y-2">
                              {(newClient.services || []).length === 0 ? (
                                <p className="text-xs text-gray-400 p-4 text-center italic">Selecciona servicios primero</p>
                              ) : (
                                (newClient.services || []).flatMap(service => surveyConfig[service] || []).map(mod => (
                                  <label key={mod.id} className="flex items-center gap-2 p-2 rounded-lg border border-gray-50 hover:bg-orange-50 cursor-pointer transition-colors">
                                    <input 
                                      type="checkbox" 
                                      checked={newClient.activeModules?.includes(mod.id)}
                                      onChange={e => {
                                        const modules = newClient.activeModules || [];
                                        if (e.target.checked) {
                                          setNewClient({...newClient, activeModules: [...modules, mod.id]});
                                        } else {
                                          setNewClient({...newClient, activeModules: modules.filter(id => id !== mod.id)});
                                        }
                                      }}
                                      className="w-4 h-4 accent-[#fa5800]"
                                    />
                                    <div>
                                      <p className="text-xs font-bold text-gray-400 uppercase">
                                        {Object.keys(surveyConfig).find(k => (surveyConfig[k] || []).some(m => m.id === mod.id))}
                                      </p>
                                      <p className="text-sm">{mod.name}</p>
                                    </div>
                                  </label>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

<Button type="submit" variant="secondary" className="w-full py-3" disabled={isSaving}>
  {isSaving
    ? 'Guardando...'
    : editingClient
      ? 'Actualizar Cliente'
      : 'Guardar Cliente'}
</Button>
                      </form>
                    </Card>
                  )}

                  <div className="grid gap-4">
                    {clients.map(client => (
                      <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden">
                            {client.logoUrl ? (
                              <img src={client.logoUrl} alt={client.companyName} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <Users size={24} className="text-gray-300" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-lg">{client.companyName}</h4>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${getClientStatus(client.evaluationRange).color}`}>
                                {getClientStatus(client.evaluationRange).label}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1 items-center">
                              {client.services.map(s => (
                                <span key={s} className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full font-bold text-gray-500 uppercase">{s}</span>
                              ))}
                              {hasEvaluatedInRange(client.id, client.evaluationRange, responses) && (
                                <span className="text-[9px] px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full font-bold uppercase flex items-center gap-1">
                                  <CheckCircle2 size={10} /> Evaluó
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Evaluación Activa</p>
<p className="text-xs font-medium text-orange-600">
  {client.activeModules.length} módulos • {client.evaluationRange?.start ? formatDate(client.evaluationRange.start) : '?'} - {client.evaluationRange?.end ? formatDate(client.evaluationRange.end) : '?'}
</p>
                            
                            {client.evaluationHistory && client.evaluationHistory.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-50">
                                <p className="text-[9px] text-gray-400 font-bold uppercase flex items-center justify-end gap-1">
                                  <History size={10} /> Historial
                                </p>
                                <div className="flex flex-col items-end gap-1 mt-1">
                                  {client.evaluationHistory.slice(-3).reverse().map((h, idx) => (
<span key={idx} className="text-[9px] text-gray-400">
  {formatDate(h.start)} al {formatDate(h.end)}
</span>
                                  ))}
                                  {client.evaluationHistory.length > 3 && (
                                    <span className="text-[8px] text-gray-300 italic">+{client.evaluationHistory.length - 3} más</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              className="text-xs py-1 px-2 h-9 border-gray-200" 
                              onClick={() => {
                                setSelectedClient(client);
                                setView('client-welcome');
                              }}
                            >
                              <User size={14} /> Ver como Cliente
                            </Button>
                            <Button variant="ghost" className="text-blue-500" onClick={() => copyClientLink(client)}>
                              <LinkIcon size={18} />
                            </Button>
                            <Button variant="ghost" onClick={() => {
                              setEditingClient(client);
                              setNewClient(client);
                              setIsAddingClient(true);
                            }}>
                              <Settings size={18} />
                            </Button>
                            <Button variant="ghost" className="text-red-500" onClick={() => handleDeleteClient(client.id)}>
                              <Trash2 size={18} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : adminTab === 'results' ? (
                <ResultsDashboard responses={responses} clients={clients} surveyConfig={surveyConfig} />
              ) : (
<ConfigEditor
  config={surveyConfig}
  onSave={async (newConfig) => {
    try {
      setIsSaving(true);
      const savedConfig = await saveSurveyConfig(newConfig);
      setSurveyConfig(savedConfig);
      alert('Configuración guardada correctamente');
    } catch (error) {
      console.error(error);
      alert('No se pudo guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  }}
/>
              )}
            </motion.div>
          )}

          {view === 'admin' && !isLoggedIn && (
            <motion.div 
              key="admin-unauthorized"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center space-y-6"
            >
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                <ShieldCheck size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-[#101c30]">Acceso Restringido</h2>
                <p className="text-gray-500">Debes iniciar sesión con tu cuenta corporativa para ver esta sección.</p>
              </div>
              <Button variant="primary" onClick={() => setView('admin-login')}>
                Ir a Iniciar Sesión
              </Button>
            </motion.div>
          )}

          {view === 'survey' && selectedClient && (
            <motion.div 
              key="survey"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <Button variant="ghost" onClick={() => {
                    setView('client-welcome');
                    setIsSubmitted(false);
                  }}>
                    <ArrowLeft size={20} />
                  </Button>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-1">
                    <div className="flex items-center gap-3">
                      {selectedClient.logoUrl && (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white shadow-sm border border-gray-100 p-1 overflow-hidden">
                          <img src={selectedClient.logoUrl} alt={selectedClient.companyName} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <h2 className="text-xl sm:text-2xl font-bold text-[#101c30]">{selectedClient.companyName}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                      {selectedClient.services.map(s => (
                        <span key={s} className="text-[9px] sm:text-[10px] px-2 py-0.5 bg-gray-100 rounded-full font-bold text-gray-500 uppercase">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-bold text-[#fa5800] uppercase tracking-widest">FT Group</p>
                </div>
              </div>

{isSubmitted || hasEvaluatedInRange(selectedClient.id, selectedClient.evaluationRange, responses) ? (
  <Card className="py-20 text-center space-y-8 border-none bg-white shadow-xl shadow-gray-100">
    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500">
      <CheckCircle2 size={48} />
    </div>
    <div className="space-y-4 max-w-md mx-auto">
      <h3 className="text-3xl sm:text-4xl font-bold text-[#101c30]">¡Muchas gracias!</h3>
      <p className="text-lg text-gray-500 leading-relaxed">
        Tu evaluación ha sido recibida correctamente. Valoramos mucho tu opinión para seguir mejorando nuestros servicios y brindarte la mejor experiencia posible.
      </p>
    </div>
  </Card>
) : (

              
<SurveyForm
  client={selectedClient}
  onSubmit={handleSurveySubmit}
  surveyConfig={surveyConfig}
  isSaving={isSaving}
/>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-12 border-t border-gray-100 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400 text-sm">
            Una herramienta elaborada por <span className="font-bold text-[#fa5800]">FT Group</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
