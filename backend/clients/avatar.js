const express = require('express');
const multer = require('multer');
const { supabase, supabaseService } = require('../supabaseClient.js');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /clients/:clientId/avatar - Upload client avatar
router.post('/:clientId/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId, 10);
    console.log('clientId type:', typeof clientId, 'value:', clientId);

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const fileExt = file.originalname.split('.').pop();
    const filePath = `client_avatars/${clientId}.${fileExt}`;

    // Upload naar Supabase Storage
    const { error: uploadError } = await supabaseService.storage
      .from('avatars')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseService.storage.from('avatars').getPublicUrl(filePath);

    // Update client_profiles tabel
    const { data: updatedRows, error: dbError } = await supabase
      .from('client_profiles')
      .upsert(
        { id: clientId, avatar_url: publicUrl }
      )
      .select();

    if (dbError) throw dbError;

    console.log('Updated row:', updatedRows?.[0]);
    res.json({ avatar_url: publicUrl });

  } catch (err) {
    console.error('Error uploading client avatar:', err);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// GET /clients/:clientId/avatar - Get client avatar
router.get('/:clientId/avatar', async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId, 10);

    const { data: profile, error } = await supabase
      .from('client_profiles')
      .select('avatar_url')
      .eq('id', clientId)
      .single();

    if (error || !profile) return res.status(404).json({ error: 'Avatar not found' });

    res.json({ avatar_url: profile.avatar_url });
  } catch (err) {
    console.error('Error fetching client avatar:', err);
    res.status(500).json({ error: 'Failed to fetch avatar' });
  }
});

module.exports = router;