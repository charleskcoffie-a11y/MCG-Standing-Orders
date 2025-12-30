
import { Section } from './types';

export const ADMIN_PASSCODE = '1927';

export const COLORS = {
  primary: '#6B0000', // Deep Imperial Maroon
  secondary: '#D4AF37', // Soft Gold
  accent: '#A02020', // Lighter Maroon for highlights
  bg: '#FBF9F6', // Warm Alabaster
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textLight: '#666666',
  border: '#E5E1DA'
};

export const SAMPLE_SECTIONS: Section[] = [
  {
    id: 'c1',
    title: 'The Constitution - Section 1: Doctrinal Standards',
    category: 'Constitution',
    orderIndex: 0,
    content: `The Methodist Church claims and cherishes its place in the Holy Catholic Church which is the Body of Christ. It rejoices in the inheritance of the Protestant Reformation and adores the evangelical faith which it has received. 

The doctrines of the evangelical faith which Methodism has set forth in its standards are based upon the divine revelation recorded in the Holy Scriptures which the Methodist Church accepts as the supreme rule of faith and practice.`
  },
  {
    id: 'so1',
    title: 'Standing Order 12 - Financial Administration',
    category: 'Standing Orders',
    orderIndex: 1,
    content: `All monies received by any person for the purposes of the Methodist Church shall be accounted for in accordance with the Standing Orders. 

1. Treasurers shall maintain accurate records of all receipts and payments. 
2. Audit procedures must be followed annually by a qualified independent person.
3. The Circuit Meeting shall oversee all financial matters within its jurisdiction.`
  },
  {
    id: 'so2',
    title: 'Standing Order 42 - Pastoral Care',
    category: 'Standing Orders',
    orderIndex: 2,
    content: `The primary responsibility for the pastoral care of members within a Local Church rests with the Minister in pastoral charge. 

The Minister shall be supported in this work by the Class Leaders and other persons appointed by the Church Council. 
Visitation should be carried out regularly, especially for the sick and housebound.`
  },
  {
    id: 'c2',
    title: 'The Constitution - Section 2: Membership',
    category: 'Constitution',
    orderIndex: 3,
    content: `Membership in the Methodist Church is open to all who desire to be saved from their sins through faith in the Lord Jesus Christ. 

Members are expected to attend the means of grace and to support the work of God in the church through service and giving.`
  }
];
