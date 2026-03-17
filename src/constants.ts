import { ServiceType, ModuleConfig } from './types';

export const COLORS = {
  primary: '#101c30', // Dark Blue
  accent: '#fa5800',  // Orange
  white: '#ffffff',
  gray: '#f3f4f6',
  text: '#1f2937',
  chart: ['#101c30', '#fa5800', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6']
};

export const DEFAULT_MODULES: Record<ServiceType, ModuleConfig[]> = {
  'Talento Humano': [
    {
      id: 'th-1',
      name: 'Diseño Organizacional',
      questions: [
        { id: 'th-1-q1', text: '¿Qué tan claras y útiles le resultan las herramientas y documentos entregados de este módulo?', type: 'rating' },
        { id: 'th-1-q2', text: 'En general, ¿qué tan satisfecho está con la Implementación del Módulo?', type: 'rating' },
        { id: 'th-1-q3', text: '¿Qué podríamos mejorar?', type: 'text' },
      ]
    },
    {
      id: 'th-2',
      name: 'Reclutamiento y Selección',
      questions: [
        { id: 'th-2-q1', text: '¿Qué tan claras y útiles le resultan las herramientas y documentos entregados de este módulo?', type: 'rating' },
        { id: 'th-2-q2', text: 'En general, ¿qué tan satisfecho está con la Implementación del Módulo?', type: 'rating' },
        { id: 'th-2-q3', text: '¿Qué podríamos mejorar?', type: 'text' },
      ]
    },
    {
      id: 'th-3',
      name: 'Evaluación del Desempeño',
      questions: [
        { id: 'th-3-q1', text: '¿Qué tan claras y útiles le resultan las herramientas y documentos entregados de este módulo?', type: 'rating' },
        { id: 'th-3-q2', text: 'En general, ¿qué tan satisfecho está con la Implementación del Módulo?', type: 'rating' },
        { id: 'th-3-q3', text: '¿Qué podríamos mejorar?', type: 'text' },
      ]
    },
    {
      id: 'th-4',
      name: 'Desarrollo y Capacitación',
      questions: [
        { id: 'th-4-q1', text: '¿Qué tan claras y útiles le resultan las herramientas y documentos entregados de este módulo?', type: 'rating' },
        { id: 'th-4-q2', text: 'En general, ¿qué tan satisfecho está con la Implementación del Módulo?', type: 'rating' },
        { id: 'th-4-q3', text: '¿Qué podríamos mejorar?', type: 'text' },
      ]
    },
    {
      id: 'th-5',
      name: 'Compensación y Beneficios',
      questions: [
        { id: 'th-5-q1', text: '¿Qué tan claras y útiles le resultan las herramientas y documentos entregados de este módulo?', type: 'rating' },
        { id: 'th-5-q2', text: 'En general, ¿qué tan satisfecho está con la Implementación del Módulo?', type: 'rating' },
        { id: 'th-5-q3', text: '¿Qué podríamos mejorar?', type: 'text' },
      ]
    },
    {
      id: 'th-6',
      name: 'Clima y Cultura Organizacional',
      questions: [
        { id: 'th-6-q1', text: '¿Qué tan claras y útiles le resultan las herramientas y documentos entregados de este módulo?', type: 'rating' },
        { id: 'th-6-q2', text: 'En general, ¿qué tan satisfecho está con la Implementación del Módulo?', type: 'rating' },
        { id: 'th-6-q3', text: '¿Qué podríamos mejorar?', type: 'text' },
      ]
    },
    {
      id: 'th-others',
      name: 'Otros Servicios de Talento',
      questions: [
        { id: 'th-o-q1', text: '¿En qué medida considera que se cumplió el objetivo de esta consultoría?', type: 'rating' },
        { id: 'th-o-q2', text: '¿Qué tan claras y útiles le resultan las herramientas y documentos entregados en esta consultoría?', type: 'rating' },
        { id: 'th-o-q3', text: 'En general, ¿qué tan satisfecho está con este proyecto?', type: 'rating' },
        { id: 'th-o-q4', text: '¿Qué podríamos mejorar?', type: 'text' },
      ]
    },
    {
      id: 'th-recruitment',
      name: 'Reclutamiento',
      questions: [
        { id: 'th-r-q1', text: '¿Qué tan satisfecho estuvo con la calidad de los candidatos presentados?', type: 'rating' },
        { id: 'th-r-q2', text: 'En general, ¿qué tan satisfecho está con el servicio de reclutamiento?', type: 'rating' },
        { id: 'th-r-q3', text: '¿Qué podríamos mejorar?', type: 'text' },
      ]
    }
  ],
  'Procesos Medulares': [
    {
      id: 'pm-1',
      name: 'Primeros 3 meses',
      questions: [
        { id: 'pm-1-q1', text: '¿Qué tan claros le resultan los procesos que hemos documentado y optimizado hasta este momento?', type: 'rating' },
        { id: 'pm-1-q2', text: '¿Cómo califica el acompañamiento recibido durante esta fase de implementación?', type: 'rating' },
        { id: 'pm-1-q3', text: 'En general, ¿qué tan satisfecho está con el avance del proyecto hasta este momento?', type: 'rating' },
        { id: 'pm-1-q4', text: '¿Qué podríamos mejorar en esta etapa?', type: 'text' },
      ]
    },
    {
      id: 'pm-2',
      name: 'Finalizar Implementación',
      questions: [
        { id: 'pm-2-q1', text: '¿Qué tanto considera que la implementación de procesos ha optimizado la forma en que opera su empresa?', type: 'rating' },
        { id: 'pm-2-q2', text: '¿Cómo califica el acompañamiento y recomendaciones recibidas durante toda la implementación?', type: 'rating' },
        { id: 'pm-2-q3', text: 'En general, ¿qué tan satisfecho está con el resultado de la implementación de procesos en su empresa?', type: 'rating' },
        { id: 'pm-2-q4', text: '¿Qué podríamos mejorar?', type: 'text' },
      ]
    }
  ],
  'Storybrand': [
    {
      id: 'sb-1',
      name: 'Finalizar Consultoría',
      questions: [
        { id: 'sb-1-q1', text: '¿En qué medida considera que se cumplió el objetivo de esta consultoría?', type: 'rating' },
        { id: 'sb-1-q2', text: '¿Qué tan claras y útiles le resultan las herramientas y documentos entregados en esta consultoría?', type: 'rating' },
        { id: 'sb-1-q3', text: 'En general, ¿qué tan satisfecho está con este proyecto?', type: 'rating' },
        { id: 'sb-1-q4', text: '¿Qué podríamos mejorar?', type: 'text' },
      ]
    }
  ],
  'Administración de Marca': [
    {
      id: 'am-1',
      name: 'Cada 3 meses',
      questions: [
        { id: 'am-1-q1', text: '¿Qué impacto considera que estas acciones están teniendo en su área comercial?', type: 'rating' },
        { id: 'am-1-q2', text: '¿Cómo califica el acompañamiento y asesoría recibidos durante la ejecución del plan?', type: 'rating' },
        { id: 'am-1-q3', text: 'En general, ¿qué tan satisfecho está con el servicio de administración de marca?', type: 'rating' },
        { id: 'am-1-q4', text: '¿Qué podríamos mejorar?', type: 'text' },
      ]
    }
  ]
};
