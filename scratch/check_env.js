require('dotenv').config({
  path: require('path').resolve(process.cwd(), '.env.local'),
});
const url = process.env.DATABASE_URL;
if (!url) {
  console.log('DATABASE_URL is missing');
} else {
  console.log('DATABASE_URL starts with:', url.substring(0, 10));
  console.log('DATABASE_URL length:', url.length);
}
