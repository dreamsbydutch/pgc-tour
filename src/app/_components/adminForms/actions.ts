"use server";

import { db } from "@/src/server/db";
import { currentUser } from "@clerk/nextjs/server";



// import { getServerSession } from 'next-auth'
// import {
//   createCourseSchema,
//   createSeasonSchema,
//   createTierSchema,
//   createTournamentSchema,
//   createTourSchema,
// } from '../../types/zod-validation'
// import { authOptions } from '@/app/auth'
// import { prisma } from 'server/db'

// export async function createSeason({
//   number,
//   year,
// }: {
//   number: number
//   year: number
// }) {
//   const session = await getServerSession(authOptions)
//   if (session?.user.role !== 'admin') throw Error('Unauthorized')

//   const output = createSeasonSchema.parse({
//     number,
//     year,
//   })

//   await prisma.season.create({
//     data: {
//       number: output.number,
//       year: output.year,
//     },
//   })
// }

// export async function createTour({
//   name,
//   logoUrl,
//   season,
// }: {
//   name: string
//   logoUrl: string
//   season: number
// }) {
//   const session = await getServerSession(authOptions)
//   if (session?.user.role !== 'admin') throw Error('Unauthorized')

//   const output = createTourSchema.parse({
//     name,
//     logoUrl,
//     season,
//   })

//   await prisma.tour.create({
//     data: {
//       name: output.name,
//       logoUrl: output.logoUrl,
//       season: { connect: { year: output.season } },
//     },
//   })
// }

// export async function createTier({
//   name,
//   points,
//   payouts,
//   year,
// }: {
//   name: string
//   points: number[]
//   payouts: number[]
//   year: number
// }) {
//   const session = await getServerSession(authOptions)
//   if (session?.user.role !== 'admin') throw Error('Unauthorized')

//   const output = createTierSchema.parse({
//     name,
//     points,
//     payouts,
//     year,
//   })

//   await prisma.tier.create({
//     data: {
//       name: output.name,
//       points: output.points,
//       payouts: output.payouts,
//       year: output.year,
//     },
//   })
// }

// export async function createTournament({
//   name,
//   courseId,
//   startDate,
//   endDate,
//   tierId,
//   seasonId,
//   currentRound,
//   logoUrl,
//   livePlay,
// }: {
//   name: string
//   courseId: string
//   startDate: Date
//   endDate: Date
//   seasonId: string
//   tierId: string
//   currentRound: number
//   livePlay: boolean
//   logoUrl: string
// }) {
//   const session = await getServerSession(authOptions)
//   if (session?.user.role !== 'admin') throw Error('Unauthorized')

//   const output = createTournamentSchema.parse({
//     name,
//     courseId,
//     startDate,
//     endDate,
//     seasonId,
//     tierId,
//     currentRound,
//     livePlay,
//     logoUrl,
//   })

//   await prisma.tournament.create({
//     data: {
//       name: output.name,
//       courseId: output.courseId,
//       startDate: output.startDate,
//       endDate: output.endDate,
//       seasonId: output.seasonId,
//       tierId: output.tierId,
//       currentRound: output.currentRound,
//       livePlay: output.livePlay,
//       logoUrl: output.logoUrl,
//     },
//   })
// }

// export async function createCourse({
//   name,
//   apiId,
//   location,
//   par,
//   front,
//   back,
// }: {
//   name: string
//   apiId: string
//   location: string
//   par: number
//   front: number
//   back: number
// }) {
//   const session = await getServerSession(authOptions)
//   if (session?.user.role !== 'admin') throw Error('Unauthorized')

//   const output = createCourseSchema.parse({
//     name,
//     apiId,
//     location,
//     par: +par,
//     front: +front,
//     back: +back,
//   })

//   await prisma.course.create({
//     data: {
//       name: output.name,
//       apiId: output.apiId,
//       location: output.location,
//       par: output.par,
//       front: output.front,
//       back: output.back,
//     },
//   })
// }
