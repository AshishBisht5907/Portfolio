import {
  Code2,
  Database,
  Github,
  Globe,
  Instagram,
  Layers3,
  Linkedin,
  Mail,
  Terminal,
  Twitter,
} from 'lucide-react';

const env = import.meta.env;
const email = env.VITE_CONTACT_EMAIL?.trim() || 'bishtashu1365@gmail.com';
const githubUrl = 'https://github.com/AshishBisht5907';

export const profile = {
  name: 'Ashish Bisht',
  role: 'Full Stack Developer',
  education: 'Computer Science Engineering Student',
  email,
  githubUrl,
  socials: [
    { name: 'GitHub', href: githubUrl, icon: Github },
    { name: 'LinkedIn', href: env.VITE_LINKEDIN_URL?.trim(), icon: Linkedin },
    { name: 'Instagram', href: env.VITE_INSTAGRAM_URL?.trim(), icon: Instagram },
    { name: 'X (Twitter)', href: env.VITE_X_URL?.trim(), icon: Twitter },
    { name: 'Email', href: `mailto:${email}`, icon: Mail },
  ].filter((social) => Boolean(social.href)),
};

export const skills = [
  { name: 'HTML & CSS', group: 'Frontend', icon: Globe },
  { name: 'JavaScript', group: 'Frontend', icon: Code2 },
  { name: 'React', group: 'Frontend', icon: Layers3 },
  { name: 'Next.js', group: 'Frontend', icon: Layers3 },
  { name: 'TypeScript', group: 'Frontend', icon: Code2 },
  { name: 'Python', group: 'Backend', icon: Terminal },
  { name: 'Django', group: 'Backend', icon: Code2 },
  { name: 'Django REST Framework', group: 'Backend', icon: Code2 },
  { name: 'PostgreSQL', group: 'Database', icon: Database },
  { name: 'Git & GitHub', group: 'Tools', icon: Github },
];

export const projects = [
  {
    number: '01',
    name: 'LifeLink',
    type: 'HEALTHCARE · FULL STACK',
    description:
      'A hospital management and healthcare coordination system designed to connect patients, families and hospital teams through role-based workflows.',
    stack: [
      'Python',
      'Django REST Framework',
      'PostgreSQL',
      'Next.js',
      'React',
      'TypeScript',
    ],
    accent: 'lifelink',
    github: 'https://github.com/AshishBisht5907/LifeLink-Healthcare',
    demo: '',
  },
  {
    number: '02',
    name: 'Urban Crate',
    type: 'E-COMMERCE · WEB APP',
    description:
      'An e-commerce web application built with Django, focused on product browsing and a structured online shopping experience.',
    stack: ['Python', 'Django', 'HTML', 'CSS', 'JavaScript'],
    accent: 'urban',
    github: githubUrl,
    demo: '',
  },
];

export const navigation = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Projects', to: '/projects' },
  { label: 'Hobbies', to: '/hobbies' },
  { label: 'Contact', to: '/contact' },
];
