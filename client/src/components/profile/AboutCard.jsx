import AboutItem from '../common/AboutItem';

const AboutCard = ({ aboutData }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-[#dddfe2]">

      <h2 className="font-headline-md text-headline-md text-[#050505] mb-6">About</h2>
      <ul className="space-y-5">
        {aboutData.map((item, index) => (
          <AboutItem key={index} item={item} />
        ))}
      </ul>
    </div>
  );
};

export default AboutCard;
