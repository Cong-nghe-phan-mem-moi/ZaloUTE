import React, { useState } from 'react';
import TopAppBar from '../components/layout/TopAppBar';
import ProfileHeader from '../components/profile/ProfileHeader';
import FriendsGrid from '../components/profile/FriendsGrid';
import AboutCard from '../components/profile/AboutCard';
import RecentActivityCard from '../components/profile/RecentActivityCard';
import FAB from '../components/common/FAB';

const ProfilePage = () => {
  const [profileData] = useState({
    name: 'Alex Nguyen',
    username: '@alex_ute_2024',
    bio: 'Passionate Software Engineering student at UTE. Exploring the intersection of UI/UX design and scalable backend systems. Let\'s connect and build something meaningful! 🚀',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHcq8ezPqDbPB7KLtkj9YETAbIfP5xhfAbHJfX4icQcL7MweRh0bBwVVAzQih4w6uw3D4fX2_tb04B0muT169Nls3zqMFsf3ENxEjyi6d13xmG85HesUbad4PC7OcMZF_apPOhChkfHFIfT6bUYrftiD59hx0Yg3GtKVUnQXeXEFz11QZBt_7btIAJgcBXZ3yUbJkQYcduaDg8asMr6tkOBcNtJhsOeN07QuQw6r70-N6ZIGNo8XUHLZEr8wolufdNO_V600H_Q0M',
    profileImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUfpoe7TJqbSIS5xkL-UUBYkne_qbubkdlrbmA5KWQBh8wrQBOQeFq-G_JAMQFSqRIiimsFiW1QwXdGaS2yGxZyNm2PH3rtdlqoIk1JovXkyNehKb7h-ssJSoMAyuuH8xWeF-OWHptAldU1JLOheMXhd8SvKSF5U8MN68Uf8idfFdEukuBZ0x_OwV_uBxz-UF_5vZC_CMwshAn_j4OboAfkO9mjnGQWwIzsVaKMETKW9xYp5o_SQEm7-NIn-gYeJLPR-B3kgJrstA',
    stats: {
      friends: '1,284',
      posts: '432',
      photos: '89'
    },
    isOnline: true
  });

  const [friendsData] = useState([
    {
      id: 1,
      name: 'Sarah Tran',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsoKsBa-1vmGR_M0EC7VovuTNMW2E5iY47dddfEPiKOsZo9yGky3vP2ZVy0JrEVaf2gXR2rjfOfCJ1wD3aOS5CDk_pkLOMPq-POpE48E7xMudz2nsNx-zOnyX4rdA_-Rly0yZUdo1m0TMr2x6PVJSHqfeTY3rtob4kGg13TNIDbDzKUx2DJMDmWh_wV55dyyFLsk5Lo_z6YI9zeDDjYKvkWeIL5cFAaiV3rzZiAgAzQEVq44kyMdOGLOdwxnZyOGiYNlFj_BiJvvw'
    },
    {
      id: 2,
      name: 'Minh Le',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzc5dDu2ggvPj2TZzXRBCWkR-0uPT60obLRhJOd4fxJ0QPOmfT8tAbRwjGd7jgqyrjM88DiPPJJcnGc_La3p1MI3EGfQnSJgiIFmU8FxMTyQRKfjrEGxRlO8Zosn5ffw3sDYVSXGMscMJZObDmmyMiD3p2RNr-rpwsIUD7brv4v_6MabOQ1F9nc65-TawhuGlGFemakVauvSXdZbrhdyexlu_LnysbujTeY3u4DRozVjmuv_I2HdPlDPijy2kI4y2j0dOG7W1cnSM'
    },
    {
      id: 3,
      name: 'Hien Pham',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhBjJRpzFJM6MqW-AAJJaTvcmAShBzdy523QKsVnrPa1Ns9jxG_pxlI2ERx40A5U0JQBCDDGJgpiRRc5AbZ5wGYKkW5NakV3ZBb6PknlpVFWfxobxSa_5Ef6TDBa3uzZzt-z86aafjYn7ruhQXhQWY1pzQyEtvEbCeBjdwEFPfPWJK_gEmqs37AllSpxUfwqRvRQrd9ROGRlUGNs3qk_-safcBoP9143iXn6g_OJ9odIY9dYolJYeRWTH8pRMSOagyJR9MDYu4eLc'
    },
    {
      id: 4,
      name: 'Quoc Bao',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbDGoG8oAQgxPzY-5LMOO8exb_UDZ44WnGgo_0fbkGDxiV3vUr5WmfmKLcAs7MIt00CGXDFOQNASAwEhpR_9qNwQ2G6ii5Oxy9ZWB02axRU_l8qQAAeQIITTql-TtjYrU9l2DyIl9mmdUdukGW0ToQPHrsMr7bfTrWHerATSmy7DBJBIxdwEU6DsDZyDWiqwT__d6qiuGFLxWNBlxM3HixNzZe7AiIYG09nXbEce8Yk7krvNaunNH4Uha0NhP8-wkw9UW4s2BodQ4'
    },
    {
      id: 5,
      name: 'Lan Anh',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5QeOyfaK873ZiwaQ0LrtFYkEPtPk9H8K6mL8vaWBvCsgENORKweY0HSy5uZfJUb9InMZkPmKPSQ59Vvfiu7Izu0gM3Ih9K7TBbzqiSWHjwpnC0106UUt8475JPAE06lTns6Tqqcbk1z0bRZJzCE4t9jmZ1ogXiOK4q5r38HdKuHcs22qdFQe8FUvPdeRIbVooUh3qLn1fqWO_MFxFDei6nI9h3kN7i4m2oXRPQARDvSle863jtWAxIcHArwtMUo3AV46S9FGYri4'
    },
    {
      id: 6,
      name: 'Duy Nguyen',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhZ_SvM8Bo8gUtW_j3IdhfiJPoWaNbNwEQ9QLcwHy-KUZ_EzQ_g1Vr8Vv3m8hagLJY_9b5KXgRkg-Q9RxZcAp44jHM3NGb5VecmKsI23XaN7o3M4GESWDGIhcyhRXiBBOZopmZQD3hr0YXY2l1eiFTHW4CuwjTQ5HCDNZezYxa4paYwc5rZEBtfA82oYrHxakzBzRveCR0xQbff0AO-1F5CRTgSl1FS19GrnRy0IIemlyi4xguRwALb4DIxMNC4_1tfN0eHlPrYzY'
    },
    {
      id: 7,
      name: 'Yen Nhi',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzOgQVHNQizWWd0zNGX2_8UxloLtUGBALN7O8bETDbuja-xljYhWWZVKQ28VDdQuD_FzrfZzEYVPY-I5k-446Q-D5znrzF8PhRl-zH3l_vMSdJWIqADkaGVl074fUpLeOlZrYLScG4h3d8wWsFebLFDv4HG-KpWWMubLPviG1Ay82CgUtnRe3G83G5wL-PL547-LNGezFJbGZYiDoFwTXbiR3yuYinJAGZDmglJAyaIMBnsUQTtH4zrUYCLMSgppdILPlRFF1AajY'
    }
  ]);

  const [aboutData] = useState([
    { icon: 'call', title: 'Phone Number', value: '+84 908 123 456' },
    { icon: 'person', title: 'Gender', value: 'Male' },
    { icon: 'cake', title: 'Birthday', value: 'January 15, 2002' },
    { icon: 'location_on', title: 'Lives in', value: 'Thu Duc, Ho Chi Minh City' },
    { icon: 'history', title: 'Member since', value: 'Joined May 2021' }
  ]);

  const [activities] = useState([
    { id: 1, description: 'Uploaded a new photo to', highlight: 'HCMUTE Memories', time: '2 hours ago', isRecent: true },
    { id: 2, description: 'Became friends with', highlight: 'Sarah Tran', time: 'Yesterday' },
    { id: 3, description: 'Updated profile bio', highlight: '', time: '3 days ago' }
  ]);

  return (
    <div className="bg-surface-container-low text-on-surface min-h-screen">
      <TopAppBar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left/Main Column */}
          <div className="lg:col-span-8 space-y-8">
            <ProfileHeader profileData={profileData} />
            <FriendsGrid friends={friendsData} totalFriends={profileData.stats.friends} />
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <AboutCard aboutData={aboutData} />
            <RecentActivityCard activities={activities} />
            
            {/* Quick Links Footer */}
            <div className="px-2">
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-on-surface-variant text-xs opacity-70">
                <a className="hover:underline hover:text-primary transition-colors" href="#">Privacy</a>
                <a className="hover:underline hover:text-primary transition-colors" href="#">Terms</a>
                <a className="hover:underline hover:text-primary transition-colors" href="#">Cookies</a>
                <a className="hover:underline hover:text-primary transition-colors" href="#">More</a>
                <span>ZaloUTE © 2024</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FAB icon="add" label="Post Update" />
    </div>
  );
};

export default ProfilePage;
