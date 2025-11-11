const IGNORE_CONFLICTS = [
  // Normalize.css группы свойств (это нормально)
  'button', 'input', 'select', 'textarea', 'sub', 'sup',
  
  // SCSS структура с вложенными селекторами
  '.conf-step__header', '.page-header',
  
  // Вероятно нормальные дублирования
  '100%', '.login__button', '.login__button:hover', 
  '.login__button:focus', '.login__button:active',
  
  // Другие селекторы из нашего отчета
  '.conf-step__button-trash:not(.conf-step__button-small)',
  '.conf-step__button-small.conf-step__button-warning',
  '.conf-step__button-small.conf-step__button-accent',
  '.login__label', '.login__input',
  '.conf-step__seances-timeline', '.conf-step__timeline-hour',
  '.conf-step__timeline-scale', '.conf-step__empty-halls',
  '.conf-step__empty-halls p', '.movie', '.tichet__check',
  '.ticket__info-wrapper', 'abbr[title]'
];

module.exports = IGNORE_CONFLICTS;