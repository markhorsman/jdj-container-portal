import Vue from 'vue'

import './styles/quasar.styl'
import lang from 'quasar/lang/nl.js'
import '@quasar/extras/roboto-font/roboto-font.css'
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/fontawesome-v5/fontawesome-v5.css'

import {
  Quasar,
  QLayout,
  QHeader,
  QDrawer,
  QPageContainer,
  QPage,
  QToolbar,
  QToolbarTitle,
  QBtn,
  QBtnGroup,
  QIcon,
  QList,
  QItem,
  QItemSection,
  QItemLabel,
  QSpace,
  QCard,
  QSpinnerHourglass,
  QInput,
  QForm,
  QStep,
  QStepper,
  QStepperNavigation,
  QChip,
  QAvatar,
  QBtnToggle,
  QCheckbox,
  QSelect,
  QTh,
  QTr,
  QTd,
  QTable,
  QAjaxBar,
  Loading,

} from 'quasar'

Vue.use(Quasar, {
  config: {},
  components: {
    QLayout,
    QHeader,
    QDrawer,
    QPageContainer,
    QPage,
    QToolbar,
    QToolbarTitle,
    QBtn,
    QBtnGroup,
    QIcon,
    QList,
    QItem,
    QItemSection,
    QItemLabel,
    QSpace,
    QCard,
    QSpinnerHourglass,
    QInput,
    QForm,
    QStep,
    QStepper,
    QStepperNavigation,
    QChip,
    QAvatar,
    QBtnToggle,
    QCheckbox,
    QSelect,
    QTh,
    QTr,
    QTd,
    QTable,
    QAjaxBar,
  },
  directives: {
  },
  plugins: {
    Loading,
  },
  extras: [
    'Fontawesome'
  ],
  lang: lang,
})