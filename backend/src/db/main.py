import pymongo
from pymongo.mongo_client import MongoClient,CodecOptions
from src.config import Config
from datetime import timezone

codec_options = CodecOptions(tz_aware=True, tzinfo= timezone.utc)
uri = Config.DATABASE_URL

client = MongoClient(uri)

db = client["auth"]

users = db.get_collection("users", codec_options=codec_options)
messages = db.get_collection("messages", codec_options=codec_options)


try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except pymongo.errors.PyMongoError as e:
    print(e)