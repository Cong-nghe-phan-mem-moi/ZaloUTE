import React from 'react';
import AboutItem from '../common/AboutItem';

const AboutCard = ({ aboutData }) => {
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-premium p-8 border border-outline-variant/30">

      <h2 className="font-headline-md text-headline-md text-on-surface mb-6">About</h2>
      <ul className="space-y-5">
        {aboutData.map((item, index) => (
          <AboutItem key={index} item={item} />
        ))}
      </ul>
    </div>
  );
};

export default AboutCard;
