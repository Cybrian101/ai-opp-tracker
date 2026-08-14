import { motion } from 'framer-motion'

export function SkeletonCard({ className = '' }) {
  return (
    <motion.div
      className={`rounded-xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 ${className}`}
      animate={{ backgroundPosition: ['0% 0%', '100% 0%'] }}
      transition={{ duration: 2, repeat: Infinity }}
      style={{
        backgroundSize: '200% 100%',
      }}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header section */}
      <div className="space-y-2">
        <SkeletonCard className="h-8 w-1/3" />
        <SkeletonCard className="h-4 w-2/3" />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1, duration: 1, repeat: Infinity }}
            className="rounded-xl p-6 border border-white/5"
            style={{ background: 'linear-gradient(135deg, rgba(30,40,70,0.5), rgba(20,30,60,0.5))' }}
          >
            <SkeletonCard className="h-4 w-1/2 mb-4" />
            <SkeletonCard className="h-6 w-3/4 mb-3" />
            <SkeletonCard className="h-3 w-full mb-2" />
            <SkeletonCard className="h-3 w-4/5" />
          </motion.div>
        ))}
      </div>

      {/* Large section */}
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, repeat: Infinity }}
        className="rounded-xl p-6 border border-white/5"
        style={{ background: 'linear-gradient(135deg, rgba(30,40,70,0.5), rgba(20,30,60,0.5))' }}
      >
        <SkeletonCard className="h-6 w-1/3 mb-4" />
        <div className="space-y-3">
          <SkeletonCard className="h-3 w-full" />
          <SkeletonCard className="h-3 w-5/6" />
          <SkeletonCard className="h-3 w-4/5" />
        </div>
      </motion.div>
    </div>
  )
}

export default DashboardSkeleton
