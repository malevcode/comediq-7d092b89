import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface FeatureCardProps {
  emoji: string;
  title: string;
  description: string;
  mascotImage?: string;
  link?: string;
  comingSoon?: boolean;
}

const FeatureCard = ({ emoji, title, description, mascotImage, link, comingSoon }: FeatureCardProps) => {
  const content = (
    <div className={`bg-gradient-to-br from-blue-50 to-[#1a5fb4]/5 rounded-2xl p-6 hover:shadow-lg hover:shadow-[#1a5fb4]/10 transition-all duration-300 h-full ${comingSoon ? 'opacity-80' : 'transform hover:scale-105 cursor-pointer'}`}>
      <div className="flex items-start gap-4">
        {mascotImage && (
          <img
            src={mascotImage}
            alt={`${title} mascot`}
            className="w-16 h-16 object-contain flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{emoji}</span>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">{description}</p>
          {comingSoon ? (
            <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-500">Coming Soon</Badge>
          ) : link ? (
            <span className="text-sm text-[#1a5fb4] font-medium hover:underline">Try it →</span>
          ) : null}
        </div>
      </div>
    </div>
  );

  return link && !comingSoon ? (
    <Link to={link} className="h-full block" style={{ textDecoration: "none" }}>
      {content}
    </Link>
  ) : (
    content
  );
};

export default FeatureCard;
