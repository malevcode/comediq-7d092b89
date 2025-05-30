
interface FeatureCardProps {
  emoji: string;
  title: string;
  description: string;
  mascotImage?: string;
}

const FeatureCard = ({ emoji, title, description, mascotImage }: FeatureCardProps) => {
  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300 transform hover:scale-105">
      {mascotImage && (
        <div className="flex justify-center mb-4">
          <img 
            src={mascotImage} 
            alt={`${title} mascot`}
            className="w-24 h-24 object-contain"
          />
        </div>
      )}
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};

export default FeatureCard;
