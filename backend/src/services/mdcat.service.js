import { prisma } from '../lib/prisma.js';

const CONFIG_ID = 1;

export const mdcatService = {
  async getConfig() {
    let config = await prisma.mdcatConfig.findUnique({ where: { id: CONFIG_ID } });
    if (!config) {
      config = await prisma.mdcatConfig.create({
        data: {
          id: CONFIG_ID,
          launchDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          currentPhase: 'Registration Open',
          phaseDescription:
            'A complete PMDC-pattern paper with instant scoring and worked solutions. Register below for early access before public bookings open.',
        },
      });
    }
    return config;
  },

  async getPublicStatus() {
    const config = await this.getConfig();
    return {
      launchDate: config.launchDate.toISOString(),
      currentPhase: config.currentPhase,
      phaseDescription: config.phaseDescription,
    };
  },

  async updateConfig({ launchDate, currentPhase, phaseDescription }) {
    await this.getConfig();
    return prisma.mdcatConfig.update({
      where: { id: CONFIG_ID },
      data: { launchDate, currentPhase, phaseDescription },
    });
  },
};
