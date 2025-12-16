// Test jobs endpoint
const supabase = require('./supabaseClient');

async function testJobs() {
  try {
    console.log('Testing jobs query...');
    
    const { data, error } = await supabase
      .from("jobs")
      .select(
        `
        id, client_id, category_id,
        title, description, area_text,
        hourly_or_fixed, hourly_rate, fixed_price,
        start_time, end_time, status, created_at,
        job_categories (
          id, key, name_nl, name_fr, name_en
        )
      `
      )
      .eq("status", "open")
      .order("start_time", { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Success!');
      console.log('Data:', JSON.stringify(data, null, 2));
      console.log('\nData is null?', data === null);
      console.log('Data is array?', Array.isArray(data));
      console.log('Data length:', data?.length);
    }

  } catch (err) {
    console.error('Caught error:', err);
  }
}

testJobs();
