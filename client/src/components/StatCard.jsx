/**
 * StatCard — displays a single dashboard statistic.
 * Props: title, value, icon, color (tailwind gradient classes), subtitle
 */
const StatCard = ({ title, value, icon, color = 'from-primary-500 to-primary-600', subtitle }) => {
    return (
        <div className="card-hover animate-fade-in group">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
                    <p className="text-3xl font-bold text-surface-900 mt-2">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-400 mt-1.5">{subtitle}</p>
                    )}
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center
                        shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-white text-xl">{icon}</span>
                </div>
            </div>
        </div>
    );
};

export default StatCard;
