import express from 'express';
import { authMiddleware } from './auth.js';
import { LeadershipMember } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// PUBLIC: list active leadership members
router.get('/', async (req,res) => {
  try {
    const members = await LeadershipMember.findAll({ where: { status: 'active' }, order: [['sortOrder','ASC'], ['createdAt','ASC']] });
    res.json({ data: members });
  } catch (e) {
    console.error('List leadership error', e);
    res.status(500).json({ message: 'Failed to list leadership' });
  }
});

// ADMIN: list all (optionally filter)
router.get('/admin', authMiddleware, async (req,res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message:'Admin only' });
  try {
    const { status } = req.query;
    const where = {};
    if (status && status !== 'all') where.status = status;
    const members = await LeadershipMember.findAll({ where, order: [['sortOrder','ASC'], ['createdAt','ASC']] });
    res.json({ data: members });
  } catch (e) {
    console.error('Admin list leadership error', e);
    res.status(500).json({ message: 'Failed to list leadership (admin)' });
  }
});

// ADMIN: create
router.post('/', authMiddleware, async (req,res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message:'Admin only' });
  try {
    const { name, title, shortBio, fullBio, imageUrl, status='active', sortOrder=0, social, meta } = req.body;
    if (!name) return res.status(400).json({ message:'Name required' });
    const existing = await LeadershipMember.count({ where: { name: { [Op.iLike]: name } } });
    const member = await LeadershipMember.create({ name, title: title||null, shortBio: shortBio||null, fullBio: fullBio||null, imageUrl: imageUrl||null, status, sortOrder: Number(sortOrder)||0, social: social||null, meta: meta||null });
    // If not provided sortOrder, push to end by using count
    if (!req.body.sortOrder) {
      await member.update({ sortOrder: existing });
    }
    res.status(201).json({ member });
  } catch (e) {
    console.error('Create leadership error', e);
    res.status(500).json({ message: 'Failed to create leadership member' });
  }
});

// ADMIN: update
router.patch('/:id', authMiddleware, async (req,res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message:'Admin only' });
  try {
    const member = await LeadershipMember.findByPk(req.params.id);
    if (!member) return res.status(404).json({ message:'Not found' });
    const allowed = ['name','title','shortBio','fullBio','imageUrl','status','sortOrder','social','meta'];
    const updates={};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k]=req.body[k];
    await member.update(updates);
    res.json({ member });
  } catch (e) {
    console.error('Update leadership error', e);
    res.status(500).json({ message: 'Failed to update leadership member' });
  }
});

// ADMIN: delete
router.delete('/:id', authMiddleware, async (req,res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message:'Admin only' });
  try {
    const member = await LeadershipMember.findByPk(req.params.id);
    if (!member) return res.status(404).json({ message:'Not found' });
    await member.destroy();
    res.json({ message:'Deleted' });
  } catch (e) {
    console.error('Delete leadership error', e);
    res.status(500).json({ message: 'Failed to delete leadership member' });
  }
});

// ADMIN: reorder (array of {id})
router.post('/reorder', authMiddleware, async (req,res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message:'Admin only' });
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ message:'Items array required' });
    await Promise.all(items.map((it, idx) => LeadershipMember.update({ sortOrder: idx }, { where: { id: it.id } })));
    res.json({ message:'Reordered' });
  } catch (e) {
    console.error('Reorder leadership error', e);
    res.status(500).json({ message:'Failed to reorder' });
  }
});

export default router;
