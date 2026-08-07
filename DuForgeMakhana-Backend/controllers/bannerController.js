import Banner from '../models/Banner.js';

// Fetch all banners
export const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    const formattedBanners = banners.map((banner) => ({
      _id: banner._id,
      text: banner.text,
      link: banner.link,   // include link in the response
      createdAt: banner.createdAt,
      image: `data:${banner.image.contentType};base64,${banner.image.data.toString('base64')}`,
    }));
    res.status(200).json(formattedBanners);
  } catch (error) {
    console.error('Error fetching banners:', error.message);
    res.status(500).json({ message: 'Failed to fetch banners' });
  }
};

// Add a new banner (with optional link)
export const addBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Banner image is required' });
    }

    const { text = '', link = '' } = req.body;

    const banner = new Banner({
      image: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      },
      text,
      link,  // save the link coming from the client
    });

    await banner.save();
    res.status(201).json({ message: 'Banner added successfully', banner: {
      _id: banner._id,
      text: banner.text,
      link: banner.link,
      createdAt: banner.createdAt,
      image: `data:${banner.image.contentType};base64,${banner.image.data.toString('base64')}`,
    }});
  } catch (error) {
    console.error('Error adding banner:', error.message);
    res.status(500).json({ message: 'Failed to add banner' });
  }
};

// Delete a banner
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    res.status(200).json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error.message);
    res.status(500).json({ message: 'Failed to delete banner' });
  }
};
