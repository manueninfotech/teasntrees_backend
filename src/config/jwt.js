const jwtConfig = {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE || '30d'
};

export default jwtConfig;
