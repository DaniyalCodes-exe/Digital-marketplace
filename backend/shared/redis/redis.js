import Redis from "ioredis"

const redis = new Redis(
    process.env.REDIS_URL || "redis://localhost:6379" ,{
        maxRetriesPerRequest:null
    }
)

redis.on("connect",()=>{
    console.log("redis connected")
})

redis.on("error",(error)=>{
  console.log("error in redis" , error)
})

export default redis