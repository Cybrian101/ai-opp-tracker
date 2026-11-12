import { LayoutDashboard, Dna, Orbit, Network, Crosshair, Hammer, Sunrise, CalendarDays } from 'lucide-react'
import DnaModule from './dna/DnaModule'
import MultiverseModule from './multiverse/MultiverseModule'
import SkillMapModule from './skillmap/SkillMapModule'
import JdLabModule from './jdlab/JdLabModule'
import BuilderModule from './builder/BuilderModule'
import ComebackModule from './comeback/ComebackModule'
import SimulatorModule from './simulator/SimulatorModule'

// Frontend registry: one entry per tab. The matching server module lives in server/modules/.
// Components receive { onBuildSkill(skill, role?), onOpenPlan({ hoursPerWeek, field }) } so modules can hand work to each other.
// `overview` is rendered by App itself (it is the original report).
export const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'comeback', label: 'Returning to work', icon: Sunrise, Component: ComebackModule },
  { id: 'dna', label: 'Career DNA', icon: Dna, Component: DnaModule },
  { id: 'multiverse', label: 'Multiverse', icon: Orbit, Component: MultiverseModule },
  { id: 'skillmap', label: 'Skill Map', icon: Network, Component: SkillMapModule },
  { id: 'jdlab', label: 'JD Lab', icon: Crosshair, Component: JdLabModule },
  { id: 'simulator', label: '90-Day Plan', icon: CalendarDays, Component: SimulatorModule },
  { id: 'builder', label: 'Builder', icon: Hammer, Component: BuilderModule },
]
