import AboutItem from '../common/AboutItem';

const AboutCard = ({ aboutData }) => {
  return (
    <div className="rounded bg-white p-5 shadow-sm">
      <h2 className="mb-5 text-base font-bold text-[#111827]">About</h2>
      <ul className="space-y-5">
        {aboutData.map((item, index) => (
          <AboutItem key={index} item={item} />
        ))}
      </ul>
    </div>
  );
};

export default AboutCard;
