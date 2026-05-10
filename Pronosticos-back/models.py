from sqlalchemy import Column, Integer, String, Float, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Competition(Base):
    __tablename__ = "competitions"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    country = Column(String)
    type = Column(String)  # 'liga' or 'copa'
    
    seasons = relationship("Season", back_populates="competition")

class Season(Base):
    __tablename__ = "seasons"
    id = Column(Integer, primary_key=True, index=True)
    competition_id = Column(String, ForeignKey("competitions.id"))
    year = Column(String)  # ej. '2023/2024'
    
    competition = relationship("Competition", back_populates="seasons")

class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    city = Column(String)
    stadium_name = Column(String)
    altitude = Column(Float)
    market_value = Column(Float, default=0.0)

class Manager(Base):
    __tablename__ = "managers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    tactical_style = Column(String)

class Player(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    name = Column(String, index=True)
    position = Column(String)

class Referee(Base):
    __tablename__ = "referees"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    avg_cards_per_game = Column(Float)
    strictness_index = Column(Float)

class Match(Base):
    __tablename__ = "matches"
    id = Column(Integer, primary_key=True, index=True)
    season_id = Column(Integer, ForeignKey("seasons.id"))
    home_team_id = Column(Integer, ForeignKey("teams.id"))
    away_team_id = Column(Integer, ForeignKey("teams.id"))
    home_manager_id = Column(Integer, ForeignKey("managers.id"), nullable=True)
    away_manager_id = Column(Integer, ForeignKey("managers.id"), nullable=True)
    referee_id = Column(Integer, ForeignKey("referees.id"), nullable=True)
    date = Column(Date)
    
    home_formation = Column(String)
    away_formation = Column(String)
    
    home_score = Column(Integer)
    away_score = Column(Integer)
    winner = Column(String)  # 'home', 'away', or 'draw'
    
    home_xG = Column(Float)
    away_xG = Column(Float)
    home_possession = Column(Float)
    away_possession = Column(Float)
    home_corners = Column(Integer)
    away_corners = Column(Integer)
    home_fouls = Column(Integer)
    away_fouls = Column(Integer)
    home_offsides = Column(Integer)
    away_offsides = Column(Integer)
    home_cards = Column(Integer)
    away_cards = Column(Integer)

class PlayerMatchStat(Base):
    __tablename__ = "player_match_stats"
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"))
    player_id = Column(Integer, ForeignKey("players.id"))
    team_id = Column(Integer, ForeignKey("teams.id"))
    
    minutes_played = Column(Integer)
    starting_xi = Column(Boolean)
    
    goals = Column(Integer, default=0)
    assists = Column(Integer, default=0)
    xG = Column(Float, default=0.0)
    xA = Column(Float, default=0.0)
    shots_total = Column(Integer, default=0)
    shots_on_target = Column(Integer, default=0)
    key_passes = Column(Integer, default=0)
    
    saves = Column(Integer, default=0)
    tackles = Column(Integer, default=0)
    interceptions = Column(Integer, default=0)
    fouls_committed = Column(Integer, default=0)
    cards_yellow = Column(Integer, default=0)
    cards_red = Column(Integer, default=0)

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"))
    prediction_type = Column(String)
    probability = Column(Float)
    ai_confidence = Column(Float)
    reasoning = Column(String)
