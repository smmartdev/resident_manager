import Badge from './Badge';

interface ResidentBadgesProps {
  resident: any;
}

export default function ResidentBadges({ resident }: ResidentBadgesProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {resident.isElderly && <Badge label="كبير السن" color="purple" />}
      {resident.isChildUnder2 && <Badge label="رضيع" color="blue" />}
      {resident.isChildUnder5 && !resident.isChildUnder2 && <Badge label="طفل" color="blue" />}
      {resident.isPregnant && <Badge label="حامل" color="orange" />}
      {resident.isBreastfeeding && <Badge label="مرضع" color="green" />}
      {resident.hasChronicDisease && <Badge label="مرض مزمن" color="red" />}
      {resident.hasDisability && <Badge label="إعاقة" color="gray" />}
    </div>
  );
}